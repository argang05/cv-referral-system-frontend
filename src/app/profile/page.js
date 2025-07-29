'use client'
import React, { useEffect, useState } from 'react'
import { User, Mail, CreditCard, Shield, Pencil, Save } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { toast } from 'sonner';

const ProfileCard = ({ user, isEditing, onChange, updatedData }) => {
  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border border-gray-200">
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-3 mr-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={updatedData.name}
                onChange={onChange}
                className="border p-1 rounded w-full"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
            )}
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-600 mr-2">{user.role}</span>
              {user.is_hr && (
                <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-700 font-medium">HR</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <Mail className="w-5 h-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={updatedData.email}
                onChange={onChange}
                className="border p-1 rounded w-full"
              />
            ) : (
              <p className="text-gray-900">{user.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm text-gray-500">Employee ID</p>
            <p className="text-gray-900">{user.emp_id}</p>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-gray-400 mr-3" />
            <div className="w-full">
              <p className="text-sm text-gray-500">New Password</p>
              <input
                type="password"
                name="password"
                value={updatedData.password}
                onChange={onChange}
                className="border p-1 rounded w-full"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, loading, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState({ name: '', email: '', password: '' });
  const [btnLoading, setBtnLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setUpdatedData({
        name: user.name,
        email: user.email,
        password: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setBtnLoading(true);
    try {
      const payload = {
        emp_id: user.emp_id,
        name: updatedData.name,
        email: updatedData.email,
        password: updatedData.password || undefined
      };

      await axios.put('/api/update-profile', payload);
      const updatedUser = await axios.get('/api/get-user-by-empid', {
        params: { emp_id: user.emp_id }
      });
      setUser(updatedUser.data);
      localStorage.setItem('user', JSON.stringify(updatedUser.data));
      setBtnLoading(false)
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setBtnLoading(false)
      toast.error('Update failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Profile</h1>
        <ProfileCard
          user={user}
          isEditing={isEditing}
          onChange={handleChange}
          updatedData={updatedData}
        />
        <div className="text-center mt-6">
          {!isEditing ? (
            <button
              className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="inline w-4 h-4 mr-1" /> Edit Profile
            </button>
          ) : (
            <button
              className="bg-green-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleSave}
            >
              <Save className="inline w-4 h-4 mr-1" /> {btnLoading ? "Saving.." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage;
