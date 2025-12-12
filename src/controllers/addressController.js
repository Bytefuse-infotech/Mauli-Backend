const Address = require('../models/Address');

/**
 * @desc    Get all addresses for logged-in customer
 * @route   GET /api/v1/addresses
 * @access  Private (Customer)
 */
const getAddresses = async (req, res) => {
    try {
        const addresses = await Address.getUserAddresses(req.user._id);

        res.status(200).json({
            success: true,
            count: addresses.length,
            data: addresses
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching addresses',
            error: error.message
        });
    }
};

/**
 * @desc    Get single address by ID
 * @route   GET /api/v1/addresses/:id
 * @access  Private (Customer)
 */
const getAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            is_active: true
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching address',
            error: error.message
        });
    }
};

/**
 * @desc    Get default address for logged-in customer
 * @route   GET /api/v1/addresses/default
 * @access  Private (Customer)
 */
const getDefaultAddress = async (req, res) => {
    try {
        const address = await Address.getDefaultAddress(req.user._id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'No default address found'
            });
        }

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (error) {
        console.error('Error fetching default address:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching default address',
            error: error.message
        });
    }
};

/**
 * @desc    Create new address
 * @route   POST /api/v1/addresses
 * @access  Private (Customer)
 */
const createAddress = async (req, res) => {
    try {
        const {
            label,
            name,
            phone,
            address_line1,
            address_line2,
            landmark,
            city,
            state,
            postal_code,
            country,
            latitude,
            longitude,
            is_default
        } = req.body;

        // Validate required fields
        if (!name || !phone || !address_line1 || !city || !state || !postal_code) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, phone, address_line1, city, state, postal_code'
            });
        }

        // Create address
        const address = await Address.create({
            user_id: req.user._id,
            label,
            name,
            phone,
            address_line1,
            address_line2,
            landmark,
            city,
            state,
            postal_code,
            country: country || 'India',
            latitude,
            longitude,
            is_default: is_default || false
        });

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: address
        });
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating address',
            error: error.message
        });
    }
};

/**
 * @desc    Update address
 * @route   PUT /api/v1/addresses/:id
 * @access  Private (Customer)
 */
const updateAddress = async (req, res) => {
    try {
        // Find address and verify ownership
        let address = await Address.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            is_active: true
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        const {
            label,
            name,
            phone,
            address_line1,
            address_line2,
            landmark,
            city,
            state,
            postal_code,
            country,
            latitude,
            longitude,
            is_default
        } = req.body;

        // Update fields
        if (label !== undefined) address.label = label;
        if (name !== undefined) address.name = name;
        if (phone !== undefined) address.phone = phone;
        if (address_line1 !== undefined) address.address_line1 = address_line1;
        if (address_line2 !== undefined) address.address_line2 = address_line2;
        if (landmark !== undefined) address.landmark = landmark;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (postal_code !== undefined) address.postal_code = postal_code;
        if (country !== undefined) address.country = country;
        if (latitude !== undefined) address.latitude = latitude;
        if (longitude !== undefined) address.longitude = longitude;
        if (is_default !== undefined) address.is_default = is_default;

        await address.save();

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
};

/**
 * @desc    Set address as default
 * @route   PATCH /api/v1/addresses/:id/set-default
 * @access  Private (Customer)
 */
const setDefaultAddress = async (req, res) => {
    try {
        // Find address and verify ownership
        const address = await Address.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            is_active: true
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Set as default
        address.is_default = true;
        await address.save();

        res.status(200).json({
            success: true,
            message: 'Address set as default successfully',
            data: address
        });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting default address',
            error: error.message
        });
    }
};

/**
 * @desc    Delete address (soft delete)
 * @route   DELETE /api/v1/addresses/:id
 * @access  Private (Customer)
 */
const deleteAddress = async (req, res) => {
    try {
        // Find address and verify ownership
        const address = await Address.findOne({
            _id: req.params.id,
            user_id: req.user._id,
            is_active: true
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Soft delete
        address.is_active = false;

        // If this was the default address, unset it
        if (address.is_default) {
            address.is_default = false;
        }

        await address.save();

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
    }
};

/**
 * @desc    Permanently delete address
 * @route   DELETE /api/v1/addresses/:id/permanent
 * @access  Private (Customer)
 */
const permanentDeleteAddress = async (req, res) => {
    try {
        // Find address and verify ownership
        const address = await Address.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Permanently delete
        await Address.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Address permanently deleted'
        });
    } catch (error) {
        console.error('Error permanently deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'Error permanently deleting address',
            error: error.message
        });
    }
};

module.exports = {
    getAddresses,
    getAddress,
    getDefaultAddress,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    permanentDeleteAddress
};
