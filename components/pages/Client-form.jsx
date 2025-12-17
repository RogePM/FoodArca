'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, Save, User, Mail, Phone, MapPin, Hash, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/SheetCart'; // Keep your existing import path

import { usePantry } from '@/components/providers/PantryProvider';

export function ClientFormDrawer({ isOpen, onOpenChange, client, onClientUpdated }) {
  const { pantryId } = usePantry();

  // Initial State matches your new Client Schema
  const initialData = {
    firstName: '',
    lastName: '',
    clientId: '',
    familySize: 1,
    email: '',
    phone: '',
    address: ''
  };

  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Reset or Populate form when opening
  useEffect(() => {
    if (isOpen) {
      setMessage({ type: '', text: '' });
      if (client) {
        setFormData({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          clientId: client.clientId || '',
          familySize: client.familySize || 1,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || ''
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, client]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.firstName) {
      setMessage({ type: 'error', text: 'First Name is required.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!client;
      const method = isEditing ? 'PUT' : 'POST';

      // 🔥 UPDATED: Point to the Client Profile API, not Distribution API
      const url = isEditing
        ? `/api/clients?id=${client._id}`
        : '/api/clients';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-pantry-id': pantryId
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save record');
      }

      setMessage({ type: 'success', text: `Client profile ${isEditing ? 'updated' : 'created'} successfully!` });

      setTimeout(() => {
        onClientUpdated();
        onOpenChange(false);
      }, 800);

    } catch (error) {
      console.error('Error saving record:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will delete the client profile but keep past distribution logs.')) return;

    setIsDeleting(true);
    try {
      // 🔥 UPDATED: Point to Client API
      const response = await fetch(`/api/clients?id=${client._id}`, {
        method: 'DELETE',
        headers: { 'x-pantry-id': pantryId }
      });

      if (!response.ok) throw new Error('Failed to delete client');

      setMessage({ type: 'success', text: 'Client deleted successfully' });

      setTimeout(() => {
        onClientUpdated();
        onOpenChange(false);
      }, 800);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white">

        {/* HEADER */}
        <SheetHeader className="px-6 py-5 border-b bg-gray-50/50">
          <SheetTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-[#d97757]" />
            {client ? 'Edit Profile' : 'New Client'}
          </SheetTitle>
          {message.text && (
            <div className={`text-sm font-medium px-3 py-2 rounded-md mt-2 w-full ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              {message.text}
            </div>
          )}
        </SheetHeader>

        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* 1. Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase">First Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Jane"
                className="bg-white"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase">Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Doe"
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <Hash className="h-3 w-3" /> Client ID (Optional)
            </Label>
            <Input
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              placeholder="e.g. CL-505"
              className="bg-white font-mono"
            />
            <p className="text-[10px] text-gray-400">If left blank, one will be generated automatically.</p>
          </div>

          <hr className="border-gray-100" />

          {/* 2. Household Stats */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <UsersIcon className="h-3 w-3" /> Household Size
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.familySize}
                onChange={(e) => handleChange('familySize', parseInt(e.target.value) || 1)}
                className="bg-white w-24"
              />
              <span className="text-sm text-gray-500">members in family</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 3. Contact Info (Optional) */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Mail className="h-3 w-3" /> Email Address
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="jane@example.com"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Phone className="h-3 w-3" /> Phone Number
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Address
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St, City, State"
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <SheetFooter className="p-6 border-t bg-gray-50 flex flex-row justify-between items-center gap-3">
          {client ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-11 w-11 shrink-0 bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 shadow-none"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </Button>
          ) : <div />}

          <div className="flex gap-3 flex-1 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 border-gray-200"
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isDeleting}
              className="h-11 bg-[#d97757] hover:bg-[#c06245] text-white min-w-[120px]"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Saving...' : (client ? 'Save Changes' : 'Create Profile')}
            </Button>
          </div>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}