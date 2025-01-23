'use client'

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { 
  useFamilyMembers, 
  createFamilyMember, 
  updateFamilyMember, 
  deleteFamilyMember, 
  setDefaultProfile,
  initFamilyProfile,
  type FamilyMember 
} from '@/hooks/useFamilyMembers';

const colors = [
  { id: '#2e7c9e', value: 'bg-[#2e7c9e]', ring: 'ring-[#2e7c9e]' },
  { id: '#e74c3c', value: 'bg-[#e74c3c]', ring: 'ring-[#e74c3c]' },
  { id: '#f1c40f', value: 'bg-[#f1c40f]', ring: 'ring-[#f1c40f]' },
  { id: '#2ecc71', value: 'bg-[#2ecc71]', ring: 'ring-[#2ecc71]' },
  { id: '#9b59b6', value: 'bg-[#9b59b6]', ring: 'ring-[#9b59b6]' },
  { id: '#34495e', value: 'bg-[#34495e]', ring: 'ring-[#34495e]' },
];

const relationships = ['self', 'spouse', 'child', 'parent', 'sibling', 'other'];

export default function FamilyPage() {
  const { members, loading, refetch } = useFamilyMembers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'self',
    dateOfBirth: '',
    gender: 'male',
    avatarColor: '#2e7c9e'
  });

  // Auto-init family profile on mount if none exist
  useEffect(() => {
    if (!loading && members.length === 0) {
      initFamilyProfile().then(() => refetch());
    }
  }, [loading, members.length, refetch]);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      relationship: 'self',
      dateOfBirth: '',
      gender: 'male',
      avatarColor: '#2e7c9e'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth?.split('T')[0] || '',
      gender: member.gender || 'male',
      avatarColor: member.avatarColor || '#2e7c9e'
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingMember) {
        await updateFamilyMember(editingMember.id, formData);
      } else {
        await createFamilyMember(formData);
      }
      refetch();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this family member?')) {
      await deleteFamilyMember(id);
      refetch();
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultProfile(id);
    refetch();
  };

  const getColorClass = (hexColor: string) => {
    return colors.find(c => c.id === hexColor)?.value || 'bg-blue-500';
  };

  const getIcon = (relationship: string) => {
    switch (relationship) {
      case 'child': return 'face_3';
      case 'parent': return 'elderly';
      case 'spouse': return 'favorite';
      default: return 'person';
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div className="w-full flex justify-between items-start md:block">
          <div>
            <h1 className="text-4xl font-black mb-3 dark:text-white">Family Profiles</h1>
            <p className="text-text-muted dark:text-gray-400 text-lg">Manage health records for your entire family.</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Add Family Member
        </button>
      </header>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-4xl p-8 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="flex flex-col items-center mb-8">
                <div className="size-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-6"></div>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          members.map((member) => (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-4xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {member.isDefault && (
                <span className="absolute top-8 right-8 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-black tracking-wider uppercase rounded-lg">Default</span>
              )}
              
              <div className="flex flex-col items-center mb-8">
                <div className={`size-24 rounded-full ${getColorClass(member.avatarColor)} flex items-center justify-center mb-6 relative text-white`}>
                  <span className="material-symbols-outlined text-4xl">
                    {getIcon(member.relationship)}
                  </span>
                  {member.isDefault && (
                    <div className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-black mb-1 dark:text-white">{member.name}</h3>
                <p className="text-xs font-bold text-text-muted tracking-widest uppercase">{member.relationship}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="text-sm font-bold dark:text-gray-200">Total Reports</span>
                </div>
                <span className="text-xl font-black dark:text-white">{member._count?.reports || 0}</span>
              </div>

              <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                {!member.isDefault && (
                  <>
                    <button 
                      onClick={() => handleSetDefault(member.id)}
                      className="px-4 py-2 text-xs font-bold text-text-muted hover:text-primary transition-colors"
                    >
                      Set Default
                    </button>
                    <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                  </>
                )}
                <button 
                  onClick={() => openEditModal(member)}
                  className="px-4 py-2 text-xs font-bold text-text-muted hover:text-primary transition-colors"
                >
                  Edit
                </button>
                <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                <button 
                  onClick={() => handleDelete(member.id)}
                  className="px-4 py-2 text-xs font-bold text-text-muted hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        {/* Add New Card */}
        {!loading && (
          <button 
            onClick={openAddModal}
            className="bg-white dark:bg-gray-800 rounded-4xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[350px] hover:border-primary transition-colors group"
          >
            <div className="size-20 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-primary transition-colors">add</span>
            </div>
            <p className="font-bold text-lg dark:text-white mb-1">Add Another Profile</p>
            <p className="text-xs text-text-muted">Track health for more family members</p>
          </button>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-text-main/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-black dark:text-white">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-text-main dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none dark:text-white appearance-none"
                >
                  {relationships.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Date of Birth</label>
                  <input 
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none dark:text-white appearance-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-widest">Avatar Color</label>
                <div className="flex gap-3">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setFormData({...formData, avatarColor: color.id})}
                      className={`size-10 rounded-full ${color.value} transition-transform hover:scale-110 ${formData.avatarColor === color.id ? `ring-2 ${color.ring} ring-offset-2 ring-offset-white dark:ring-offset-gray-800` : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-text-muted font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || !formData.name}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                    Saving...
                  </>
                ) : (
                  'Save Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
