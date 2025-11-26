const Role = require('../models/Role');
const Joi = require('joi');

const createRole = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            description: Joi.string().optional(),
            permissions: Joi.array().items(Joi.string()).default([]),
            companyId: Joi.string().required() // Roles are company-scoped
        });

        const { error } = schema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const role = new Role(req.body);
        await role.save();

        res.status(201).json({ message: 'Role created successfully', role });
    } catch (error) {
        next(error);
    }
};

const getRoles = async (req, res, next) => {
    try {
        const { companyId } = req.query; // Or from req.user.companyId
        // If user is admin/superadmin, maybe they can see all? For now, strict company scope.
        // Assuming req.user is populated by auth middleware

        const userCompanyId = req.user.companyId || companyId;

        const roles = await Role.find({
            $or: [
                { companyId: userCompanyId },
                { isSystemRole: true }
            ]
        });

        res.status(200).json({ roles });
    } catch (error) {
        next(error);
    }
};

const getRoleById = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });
        res.status(200).json({ role });
    } catch (error) {
        next(error);
    }
};

const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);

        if (!role) return res.status(404).json({ message: 'Role not found' });
        if (role.isSystemRole) return res.status(403).json({ message: 'Cannot edit system roles' });

        const updatedRole = await Role.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ message: 'Role updated', role: updatedRole });
    } catch (error) {
        next(error);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);

        if (!role) return res.status(404).json({ message: 'Role not found' });
        if (role.isSystemRole) return res.status(403).json({ message: 'Cannot delete system roles' });

        await Role.findByIdAndDelete(id);
        res.status(200).json({ message: 'Role deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRole,
    getRoles,
    getRoleById,
    updateRole,
    deleteRole
};
