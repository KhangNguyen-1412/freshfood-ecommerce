import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import AddressForm from "../profile/AddressForm";

const AddressSelection = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onSaveAddress,
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleAddNew = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleSave = (addressData) => {
    onSaveAddress(addressData);
    setShowAddressForm(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Chọn địa chỉ giao hàng</h2>
      <div className="space-y-3">
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700"
          >
            <input
              type="radio"
              name="address"
              value={addr.id}
              checked={selectedAddressId === addr.id}
              onChange={(e) => onSelectAddress(e.target.value)}
              className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <div>
              <p className="font-semibold">
                {addr.name} - {addr.phone}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {addr.address}
              </p>
            </div>
          </label>
        ))}
      </div>
      <button
        onClick={handleAddNew}
        className="mt-4 flex items-center text-green-600 hover:underline"
      >
        <PlusCircle size={18} className="mr-1" /> Thêm địa chỉ mới
      </button>
      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onSave={handleSave}
          onCancel={() => setShowAddressForm(false)}
        />
      )}
    </div>
  );
};

export default AddressSelection;
