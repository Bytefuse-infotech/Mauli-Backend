// Frontend Integration Example for Address Management API
// This file shows how to integrate the address API in your React/JavaScript frontend

// ============================================================================
// 1. API Service Layer (addressService.js)
// ============================================================================

const API_BASE_URL = 'http://localhost:5000/api/v1';

class AddressService {
    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('token');
    }

    // Get headers with auth token
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
        };
    }

    // Get all addresses
    async getAllAddresses() {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch addresses');
            }

            return data;
        } catch (error) {
            console.error('Error fetching addresses:', error);
            throw error;
        }
    }

    // Get single address
    async getAddress(addressId) {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch address');
            }

            return data;
        } catch (error) {
            console.error('Error fetching address:', error);
            throw error;
        }
    }

    // Get default address
    async getDefaultAddress() {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/default`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No default address found');
            }

            return data;
        } catch (error) {
            console.error('Error fetching default address:', error);
            throw error;
        }
    }

    // Create new address
    async createAddress(addressData) {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(addressData)
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create address');
            }

            return data;
        } catch (error) {
            console.error('Error creating address:', error);
            throw error;
        }
    }

    // Update address
    async updateAddress(addressId, addressData) {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(addressData)
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update address');
            }

            return data;
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    }

    // Set address as default
    async setDefaultAddress(addressId) {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/set-default`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to set default address');
            }

            return data;
        } catch (error) {
            console.error('Error setting default address:', error);
            throw error;
        }
    }

    // Delete address (soft delete)
    async deleteAddress(addressId) {
        try {
            const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete address');
            }

            return data;
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const addressService = new AddressService();

// ============================================================================
// 2. React Component Example (AddressManager.jsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { addressService } from './addressService';

export const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Load addresses on component mount
    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const response = await addressService.getAllAddresses();
            setAddresses(response.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAddress = async (addressData) => {
        try {
            await addressService.createAddress(addressData);
            await loadAddresses(); // Reload addresses
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            await addressService.setDefaultAddress(addressId);
            await loadAddresses(); // Reload to show updated default
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (addressId) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await addressService.deleteAddress(addressId);
                await loadAddresses(); // Reload addresses
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) return <div>Loading addresses...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="address-manager">
            <h2>My Addresses</h2>

            <button onClick={() => setShowForm(true)}>
                Add New Address
            </button>

            <div className="address-list">
                {addresses.map(address => (
                    <div key={address._id} className="address-card">
                        <div className="address-header">
                            <span className="label">{address.label}</span>
                            {address.is_default && <span className="badge">Default</span>}
                        </div>

                        <div className="address-details">
                            <p><strong>{address.name}</strong></p>
                            <p>{address.phone}</p>
                            <p>{address.address_line1}</p>
                            {address.address_line2 && <p>{address.address_line2}</p>}
                            {address.landmark && <p>Landmark: {address.landmark}</p>}
                            <p>{address.city}, {address.state} - {address.postal_code}</p>
                            <p>{address.country}</p>
                        </div>

                        <div className="address-actions">
                            {!address.is_default && (
                                <button onClick={() => handleSetDefault(address._id)}>
                                    Set as Default
                                </button>
                            )}
                            <button onClick={() => handleDelete(address._id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <AddressForm
                    onSubmit={handleCreateAddress}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

// ============================================================================
// 3. Address Form Component (AddressForm.jsx)
// ============================================================================

export const AddressForm = ({ onSubmit, onCancel, initialData = {} }) => {
    const [formData, setFormData] = useState({
        label: initialData.label || 'home',
        name: initialData.name || '',
        phone: initialData.phone || '',
        address_line1: initialData.address_line1 || '',
        address_line2: initialData.address_line2 || '',
        landmark: initialData.landmark || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postal_code: initialData.postal_code || '',
        country: initialData.country || 'India',
        is_default: initialData.is_default || false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="address-form">
            <h3>Add New Address</h3>

            <div className="form-group">
                <label>Address Type</label>
                <select name="label" value={formData.label} onChange={handleChange}>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="form-group">
                <label>Name *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Phone *</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Address Line 1 *</label>
                <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Address Line 2</label>
                <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label>Landmark</label>
                <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>City *</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>State *</label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Country</label>
                    <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        name="is_default"
                        checked={formData.is_default}
                        onChange={handleChange}
                    />
                    Set as default address
                </label>
            </div>

            <div className="form-actions">
                <button type="submit">Save Address</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};

// ============================================================================
// 4. Checkout Integration Example
// ============================================================================

export const CheckoutPage = () => {
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);

    useEffect(() => {
        loadDefaultAddress();
    }, []);

    const loadDefaultAddress = async () => {
        try {
            // Try to get default address first
            const response = await addressService.getDefaultAddress();
            setSelectedAddress(response.data);
        } catch (err) {
            // If no default, load all addresses
            const response = await addressService.getAllAddresses();
            setAddresses(response.data);
            if (response.data.length > 0) {
                setSelectedAddress(response.data[0]);
            }
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }

        // Use selectedAddress._id in your order creation
        const orderData = {
            shipping_address_id: selectedAddress._id,
            // ... other order fields
        };

        // Create order...
    };

    return (
        <div className="checkout">
            <h2>Checkout</h2>

            <div className="delivery-address">
                <h3>Delivery Address</h3>
                {selectedAddress ? (
                    <div className="selected-address">
                        <p><strong>{selectedAddress.name}</strong></p>
                        <p>{selectedAddress.address_line1}</p>
                        <p>{selectedAddress.city}, {selectedAddress.state}</p>
                        <button onClick={() => setSelectedAddress(null)}>
                            Change Address
                        </button>
                    </div>
                ) : (
                    <AddressSelector
                        addresses={addresses}
                        onSelect={setSelectedAddress}
                    />
                )}
            </div>

            <button onClick={handlePlaceOrder}>
                Place Order
            </button>
        </div>
    );
};

// ============================================================================
// 5. Usage Examples
// ============================================================================

// Example 1: Load all addresses
async function example1() {
    const response = await addressService.getAllAddresses();
    console.log('All addresses:', response.data);
}

// Example 2: Create new address
async function example2() {
    const newAddress = {
        label: 'home',
        name: 'John Doe',
        phone: '+919876543210',
        address_line1: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        is_default: true
    };

    const response = await addressService.createAddress(newAddress);
    console.log('Created address:', response.data);
}

// Example 3: Update address
async function example3() {
    const addressId = '64abc123def456789';
    const updates = {
        landmark: 'Near New Shopping Mall',
        phone: '+919876543211'
    };

    const response = await addressService.updateAddress(addressId, updates);
    console.log('Updated address:', response.data);
}

// Example 4: Set default address
async function example4() {
    const addressId = '64abc123def456789';
    const response = await addressService.setDefaultAddress(addressId);
    console.log('Default address set:', response.data);
}

// Example 5: Delete address
async function example5() {
    const addressId = '64abc123def456789';
    const response = await addressService.deleteAddress(addressId);
    console.log('Address deleted:', response.message);
}
