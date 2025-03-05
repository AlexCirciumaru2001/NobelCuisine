import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Camera, Mail, Lock, AlertCircle, Check } from 'lucide-react';
import ImagePreview from './ImagePreview';

export default function Profile() {
  const { user, signOut } = useAuth(); // Removed signInWithGoogle
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState({
    email: user?.email || '',
    avatar_url: user?.user_metadata?.avatar_url || '',
    full_name: user?.user_metadata?.full_name || '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        full_name: user.user_metadata?.full_name || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updates = {
        email: profile.email,
        data: {
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
        },
      };

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setMessage({ type: 'success', text: t('profile.success.update') });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('profile.error.update')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setMessage({ type: 'success', text: t('profile.success.password') });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('profile.error.password')
      });
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        // Target dimensions (1:1 aspect ratio)
        const targetSize = 400; // Size for high quality avatar
        
        // Calculate dimensions maintaining aspect ratio
        let width = targetSize;
        let height = targetSize;
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to target dimensions
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Fill background with white (for transparent images)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Calculate scaling and position for center crop
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width - img.width * scale) * 0.5;
        const y = (height - img.height * scale) * 0.5;

        // Draw image with center crop
        ctx.drawImage(
          img,
          x, y,
          img.width * scale,
          img.height * scale
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create image blob'));
            }
          },
          'image/jpeg',
          0.9 // Quality
        );
      };

      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
      setMessage({
        type: 'error',
        text: 'Tipul fișierului nu este acceptat. Te rugăm să folosești imagini JPG, PNG sau GIF.'
      });
      return;
    }

    // Validate file size (max 5MB for original)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'Imaginea este prea mare. Dimensiunea maximă permisă este 5MB.'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Process image
      const processedImage = await processImage(file);

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldFilePath = profile.avatar_url.split('/').pop();
        if (oldFilePath) {
          await supabase.storage
            .from('profiles')
            .remove([`${user?.id}/${oldFilePath}`]);
        }
      }

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${user?.id}/${timestamp}.jpg`; // Always save as JPG after processing

      // Upload processed avatar
      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(fileName, processedImage, {
          cacheControl: '0',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update local state and force image refresh
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setAvatarKey(timestamp);
      setMessage({ type: 'success', text: t('profile.success.avatar') });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('profile.error.avatar')
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-8">{t('profile.title')}</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Camera className="h-5 w-5 text-primary mr-2" />
            {t('profile.avatar.title')}
          </h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => profile.avatar_url && setShowImagePreview(true)}
              >
                {profile.avatar_url ? (
                  <img
                    key={avatarKey}
                    src={`${profile.avatar_url}?t=${avatarKey}`}
                    alt={profile.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full p-4 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('profile.avatar.help')}</p>
              <p className="text-xs text-gray-500 mt-1">Formate acceptate: JPG, PNG, GIF (max 5MB)</p>
              {profile.avatar_url && (
                <p className="text-xs text-gray-500 mt-1">Click pe imagine pentru previzualizare</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 text-primary mr-2" />
            {t('profile.info.title')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.info.name')}
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                placeholder={t('profile.info.namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.info.email')}
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? t('profile.loading') : t('profile.info.save')}
            </button>
          </div>
        </form>

        {/* Password Change */}
        <form onSubmit={handleUpdatePassword} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Lock className="h-5 w-5 text-primary mr-2" />
            {t('profile.password.title')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.password.new')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-primary focus:border-primary"
                minLength={6}
                placeholder={t('profile.password.placeholder')}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? t('profile.loading') : t('profile.password.save')}
            </button>
          </div>
        </form>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && profile.avatar_url && (
        <ImagePreview
          src={`${profile.avatar_url}?t=${avatarKey}`}
          alt={profile.full_name || 'Profile'}
          onClose={() => setShowImagePreview(false)}
        />
      )}
    </div>
  );
}