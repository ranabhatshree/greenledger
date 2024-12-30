const ExpenseCategories = require('../models/ExpenseCategories');
const { createCategorySchema, updateCategorySchema } = require('../validators/expenseCategoryValidator');

// Create Category
const createCategory = async (req, res) => {
    try {
        const { error, value } = createCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const category = new ExpenseCategories({
            ...value,
            createdBy: req.user.id, // Populated by `protect` middleware
        });

        await category.save();
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Update Category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const category = await ExpenseCategories.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        Object.assign(category, value, { updatedAt: Date.now() });
        await category.save();

        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// View All Categories
const viewCategories = async (req, res) => {
    try {
        const categories = await ExpenseCategories.find().populate('createdBy', 'name');
        res.status(200).json({ categories });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Get Category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await ExpenseCategories.findById(id).populate('createdBy', 'name email role');
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ category });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await ExpenseCategories.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await category.remove();
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

module.exports = {
    createCategory,
    updateCategory,
    viewCategories,
    getCategoryById,
    deleteCategory,
};
