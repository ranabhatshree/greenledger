const BulkSales = require('../models/BulkSales');
const FileUpload = require('../models/FileUpload');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Create Bulk Sale (manual entry)
const createBulkSale = async (req, res, next) => {
    try {
        const { invoiceNumber, invoiceDate, totalAmount, notes } = req.body;

        // Validation
        if (!invoiceNumber || !invoiceDate || totalAmount === undefined) {
            return res.status(400).json({ 
                message: 'invoiceNumber, invoiceDate, and totalAmount are required' 
            });
        }

        // Validate date format
        const date = new Date(invoiceDate);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ message: 'Invalid invoiceDate format' });
        }

        // Validate totalAmount is a number
        const amount = parseFloat(totalAmount);
        if (isNaN(amount) || amount < 0) {
            return res.status(400).json({ message: 'totalAmount must be a valid positive number' });
        }

        // Create bulk sale
        const bulkSale = new BulkSales({
            invoiceNumber,
            invoiceDate: date,
            totalAmount: amount,
            notes: notes || null,
            companyId: req.user.companyId,
            createdBy: req.user.id,
        });

        await bulkSale.save();
        res.status(201).json({ message: 'Bulk sale created successfully', bulkSale });
    } catch (error) {
        next(error);
    }
};

// Get All Bulk Sales (with filters and pagination)
const getAllBulkSales = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            from, 
            to, 
            invoiceNumber,
            uploadedByCSVRef 
        } = req.query;

        const query = { companyId: req.user.companyId };

        // Date range filter
        if (from || to) {
            query.invoiceDate = {};
            if (from) query.invoiceDate.$gte = new Date(from);
            if (to) query.invoiceDate.$lte = new Date(to);
        }

        // Invoice number filter
        if (invoiceNumber) {
            query.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
        }

        // CSV reference filter
        if (uploadedByCSVRef) {
            query.uploadedByCSVRef = uploadedByCSVRef;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const bulkSales = await BulkSales.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await BulkSales.countDocuments(query);

        res.status(200).json({
            bulkSales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get Bulk Sale by ID
const getBulkSaleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bulkSale = await BulkSales.findOne({
            _id: id,
            companyId: req.user.companyId,
        }).populate('createdBy', 'name email');

        if (!bulkSale) {
            return res.status(404).json({ message: 'Bulk sale not found' });
        }

        res.status(200).json({ bulkSale });
    } catch (error) {
        next(error);
    }
};

// Update Bulk Sale
const updateBulkSale = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { invoiceNumber, invoiceDate, totalAmount, notes } = req.body;

        const bulkSale = await BulkSales.findOne({
            _id: id,
            companyId: req.user.companyId,
        });

        if (!bulkSale) {
            return res.status(404).json({ message: 'Bulk sale not found' });
        }

        // Update fields if provided
        if (invoiceNumber !== undefined) bulkSale.invoiceNumber = invoiceNumber;
        
        if (invoiceDate !== undefined) {
            const date = new Date(invoiceDate);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ message: 'Invalid invoiceDate format' });
            }
            bulkSale.invoiceDate = date;
        }

        if (totalAmount !== undefined) {
            const amount = parseFloat(totalAmount);
            if (isNaN(amount) || amount < 0) {
                return res.status(400).json({ message: 'totalAmount must be a valid positive number' });
            }
            bulkSale.totalAmount = amount;
        }

        if (notes !== undefined) bulkSale.notes = notes || null;

        bulkSale.updatedAt = Date.now();
        await bulkSale.save();

        res.status(200).json({ message: 'Bulk sale updated successfully', bulkSale });
    } catch (error) {
        next(error);
    }
};

// Delete Bulk Sale
const deleteBulkSale = async (req, res, next) => {
    try {
        const { id } = req.params;

        const bulkSale = await BulkSales.findOne({
            _id: id,
            companyId: req.user.companyId,
        });

        if (!bulkSale) {
            return res.status(404).json({ message: 'Bulk sale not found' });
        }

        await bulkSale.deleteOne();
        res.status(200).json({ message: 'Bulk sale deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Upload and Process CSV File
const uploadBulkSalesCSV = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'CSV file is required' });
        }

        const filePath = req.file.path;
        const storedFilename = req.file.filename;
        const originalFilename = req.file.originalname;

        // Create FileUpload record
        const fileUpload = new FileUpload({
            originalFilename,
            storedFilename,
            filePath,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user.id,
            companyId: req.user.companyId,
            uploadType: 'bulk_sales_csv',
            status: 'processing',
        });

        await fileUpload.save();

        const rows = [];
        const errors = [];
        const createdBulkSales = [];
        const duplicateInvoiceNumbers = [];

        // Read and parse CSV file
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', async () => {
                try {
                    // Validate CSV has required headers
                    if (rows.length === 0) {
                        fileUpload.status = 'failed';
                        fileUpload.errorMessage = 'CSV file is empty';
                        await fileUpload.save();
                        fs.unlinkSync(filePath); // Clean up file
                        return res.status(400).json({ 
                            message: 'CSV file is empty',
                            fileUpload 
                        });
                    }

                    // Check for required headers (case-insensitive)
                    const firstRow = rows[0];
                    const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());
                    const requiredHeaders = ['invoicenumber', 'totalamount', 'invoicedate'];
                    // Notes is optional, so we don't check for it
                    
                    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                    if (missingHeaders.length > 0) {
                        fileUpload.status = 'failed';
                        fileUpload.errorMessage = `Missing required headers: ${missingHeaders.join(', ')}`;
                        await fileUpload.save();
                        fs.unlinkSync(filePath);
                        return res.status(400).json({ 
                            message: `Missing required headers: ${missingHeaders.join(', ')}`,
                            fileUpload 
                        });
                    }

                    // Process each row
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

                        try {
                            // Extract data (case-insensitive)
                            const invoiceNumber = row.invoiceNumber || row.invoicenumber || row['Invoice Number'] || '';
                            const totalAmount = row.totalAmount || row.totalamount || row['Total Amount'] || '';
                            const invoiceDate = row.invoiceDate || row.invoicedate || row['Invoice Date'] || '';
                            const notes = row.notes || row.Notes || row['Notes'] || '';

                            // Validate required fields
                            if (!invoiceNumber || invoiceNumber.trim() === '') {
                                errors.push({
                                    row: rowNumber,
                                    invoiceNumber: invoiceNumber || 'N/A',
                                    error: 'Missing invoiceNumber',
                                });
                                continue;
                            }

                            if (!totalAmount || totalAmount.toString().trim() === '') {
                                errors.push({
                                    row: rowNumber,
                                    invoiceNumber,
                                    error: 'Missing totalAmount',
                                });
                                continue;
                            }

                            if (!invoiceDate || invoiceDate.toString().trim() === '') {
                                errors.push({
                                    row: rowNumber,
                                    invoiceNumber,
                                    error: 'Missing invoiceDate',
                                });
                                continue;
                            }

                            // Validate and parse date
                            const date = new Date(invoiceDate);
                            if (isNaN(date.getTime())) {
                                errors.push({
                                    row: rowNumber,
                                    invoiceNumber,
                                    error: `Invalid invoiceDate format: ${invoiceDate}`,
                                });
                                continue;
                            }

                            // Validate and parse amount
                            const amount = parseFloat(totalAmount);
                            if (isNaN(amount) || amount < 0) {
                                errors.push({
                                    row: rowNumber,
                                    invoiceNumber,
                                    error: `Invalid totalAmount: ${totalAmount}`,
                                });
                                continue;
                            }

                            // Check for duplicate invoice numbers within the same company (optional check)
                            const existingBulkSale = await BulkSales.findOne({
                                invoiceNumber: invoiceNumber.trim(),
                                companyId: req.user.companyId,
                            });

                            if (existingBulkSale) {
                                duplicateInvoiceNumbers.push({
                                    row: rowNumber,
                                    invoiceNumber: invoiceNumber.trim(),
                                    existingId: existingBulkSale._id,
                                });
                                // Continue processing - don't create duplicate, but don't fail the whole upload
                                continue;
                            }

                            // Create bulk sale entry
                            const bulkSale = new BulkSales({
                                invoiceNumber: invoiceNumber.trim(),
                                invoiceDate: date,
                                totalAmount: amount,
                                notes: notes && notes.trim() ? notes.trim() : null,
                                companyId: req.user.companyId,
                                createdBy: req.user.id,
                                uploadedByCSVRef: storedFilename,
                            });

                            await bulkSale.save();
                            createdBulkSales.push(bulkSale);
                        } catch (err) {
                            errors.push({
                                row: rowNumber,
                                invoiceNumber: row.invoiceNumber || row.invoicenumber || 'N/A',
                                error: err.message,
                            });
                        }
                    }

                    // Update file upload record
                    fileUpload.recordCount = createdBulkSales.length;
                    fileUpload.status = errors.length === rows.length ? 'failed' : 'completed';
                    if (errors.length > 0 && createdBulkSales.length === 0) {
                        fileUpload.errorMessage = `All ${errors.length} rows failed validation`;
                    } else if (errors.length > 0) {
                        fileUpload.errorMessage = `${errors.length} rows failed validation`;
                    }
                    await fileUpload.save();

                    // Don't delete the file - keep it for traceability
                    // fs.unlinkSync(filePath);

                    // Return response
                    res.status(201).json({
                        message: `Processed ${rows.length} rows. ${createdBulkSales.length} created, ${errors.length} errors, ${duplicateInvoiceNumbers.length} duplicates skipped.`,
                        fileUpload,
                        summary: {
                            totalRows: rows.length,
                            created: createdBulkSales.length,
                            errors: errors.length,
                            duplicates: duplicateInvoiceNumbers.length,
                        },
                        createdBulkSales: createdBulkSales.slice(0, 100), // Limit response size
                        errorDetails: errors.slice(0, 100), // Limit response size
                        duplicateDetails: duplicateInvoiceNumbers.slice(0, 100),
                    });
                } catch (error) {
                    fileUpload.status = 'failed';
                    fileUpload.errorMessage = error.message;
                    await fileUpload.save();
                    fs.unlinkSync(filePath);
                    res.status(500).json({ 
                        message: 'Error processing CSV file',
                        error: error.message,
                        fileUpload 
                    });
                }
            })
            .on('error', async (error) => {
                fileUpload.status = 'failed';
                fileUpload.errorMessage = error.message;
                await fileUpload.save();
                fs.unlinkSync(filePath);
                res.status(500).json({ 
                    message: 'Error reading CSV file',
                    error: error.message,
                    fileUpload 
                });
            });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBulkSale,
    getAllBulkSales,
    getBulkSaleById,
    updateBulkSale,
    deleteBulkSale,
    uploadBulkSalesCSV,
};

