'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

type WizardStep = 'basic' | 'pricing' | 'amenities' | 'beds' | 'photos' | 'rules' | 'contact' | 'group' | 'seasonal';

const STEPS: { id: WizardStep; label: string; icon: string }[] = [
  { id: 'basic', label: 'Basic Info', icon: '📝' },
  { id: 'pricing', label: 'Pricing', icon: '💰' },
  { id: 'amenities', label: 'Amenities', icon: '✨' },
  { id: 'beds', label: 'Beds', icon: '🛏️' },
  { id: 'photos', label: 'Photos', icon: '📸' },
  { id: 'rules', label: 'Rules', icon: '📋' },
  { id: 'contact', label: 'Contact', icon: '📞' },
  { id: 'group', label: 'Group', icon: '🏘️' },
  { id: 'seasonal', label: 'Seasonal', icon: '📅' },
];

const AMENITIES = [
  'WiFi',
  'TV',
  'Kitchen',
  'Washing Machine',
  'Air Conditioning',
  'Heating',
  'Parking',
  'Pool',
  'Gym',
  'Balcony',
  'Garden',
  'BBQ',
];

export function PropertyWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    basic: {
      name: '',
      type: 'apartment',
      description: '',
      location: '',
      address: '',
      city: '',
      country: 'Kenya',
      postalCode: '',
    },
    pricing: {
      basePrice: '',
      currency: 'KES',
      cleaningFee: '',
      securityDeposit: '',
      minStay: '1',
      maxGuests: '2',
    },
    amenities: {
      amenities: [] as string[],
    },
    beds: {
      beds: [] as Array<{ roomName: string; bedType: string; quantity: number }>,
    },
    photos: {
      photos: [] as File[],
      photo_urls: [] as string[],
    },
    rules: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      smokingAllowed: false,
      petsAllowed: false,
      partiesAllowed: false,
      rules: '',
    },
    contact: {
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    },
    group: {
      groupId: '',
      groupName: '',
    },
    seasonal: {
      seasonalPricing: [] as Array<{ name: string; startDate: string; endDate: string; price: string }>,
    },
  });

  const handleNext = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }
    setPhotoUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB`); continue; }
      const ext = file.name.split('.').pop();
      const path = `${user.id}/tmp/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('property-photos').upload(path, file, { upsert: true });
      if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from('property-photos').getPublicUrl(path);
      newUrls.push(publicUrl);
    }
    setUploadedPhotoUrls(prev => [...prev, ...newUrls]);
    setFormData(prev => ({ ...prev, photos: { ...prev.photos, photo_urls: [...prev.photos.photo_urls, ...newUrls] } }));
    setPhotoUploading(false);
    if (newUrls.length) toast.success(`${newUrls.length} photo(s) uploaded`);
  };

  const handleRemovePhoto = (url: string) => {
    setUploadedPhotoUrls(prev => prev.filter(u => u !== url));
    setFormData(prev => ({ ...prev, photos: { ...prev.photos, photo_urls: prev.photos.photo_urls.filter(u => u !== url) } }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photo_urls: uploadedPhotoUrls }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error?.message || 'Failed to create property');
        return;
      }

      toast.success('Property created successfully!');
      router.push('/properties');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1"
              onClick={() => setCurrentStep(step.id)}
            >
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-200 text-surface-600'
                }`}
              >
                {index + 1}
              </button>
              <span className="text-xs text-center text-surface-600">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-surface-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">
              {STEPS.find((s) => s.id === currentStep)?.icon}
            </span>
            {STEPS.find((s) => s.id === currentStep)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 'basic' && (
            <div className="space-y-4">
              <Input
                label="Property Name"
                placeholder="e.g., Cozy Apartment in Nairobi"
                value={formData.basic.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basic: { ...formData.basic, name: e.target.value },
                  })
                }
              />
              <div>
                <label className="block text-sm font-medium text-surface-900 mb-2">
                  Property Type
                </label>
                <select
                  value={formData.basic.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basic: { ...formData.basic, type: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="studio">Studio</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="Description"
                placeholder="Describe your property..."
                value={formData.basic.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basic: { ...formData.basic, description: e.target.value },
                  })
                }
              />
              <Input
                label="Location"
                placeholder="e.g., Westlands, Nairobi"
                value={formData.basic.location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basic: { ...formData.basic, location: e.target.value },
                  })
                }
              />
              <Input
                label="Address"
                placeholder="Street address"
                value={formData.basic.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basic: { ...formData.basic, address: e.target.value },
                  })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Nairobi"
                  value={formData.basic.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basic: { ...formData.basic, city: e.target.value },
                    })
                  }
                />
                <Input
                  label="Country"
                  placeholder="Kenya"
                  value={formData.basic.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basic: { ...formData.basic, country: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {currentStep === 'pricing' && (
            <div className="space-y-4">
              <Input
                label="Base Price (per night)"
                type="number"
                placeholder="5000"
                value={formData.pricing.basePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, basePrice: e.target.value },
                  })
                }
              />
              <Input
                label="Cleaning Fee"
                type="number"
                placeholder="1000"
                value={formData.pricing.cleaningFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, cleaningFee: e.target.value },
                  })
                }
              />
              <Input
                label="Security Deposit"
                type="number"
                placeholder="5000"
                value={formData.pricing.securityDeposit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, securityDeposit: e.target.value },
                  })
                }
              />
              <Input
                label="Minimum Stay (nights)"
                type="number"
                placeholder="1"
                value={formData.pricing.minStay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, minStay: e.target.value },
                  })
                }
              />
              <Input
                label="Maximum Guests"
                type="number"
                placeholder="4"
                value={formData.pricing.maxGuests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: { ...formData.pricing, maxGuests: e.target.value },
                  })
                }
              />
            </div>
          )}

          {currentStep === 'amenities' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-600">Select amenities available at your property</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            amenities: {
                              amenities: [...formData.amenities.amenities, amenity],
                            },
                          });
                        } else {
                          setFormData({
                            ...formData,
                            amenities: {
                              amenities: formData.amenities.amenities.filter(
                                (a) => a !== amenity
                              ),
                            },
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'beds' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-600 mb-4">
                Add bed configurations for each room
              </p>
              {formData.beds.beds.map((bed, index) => (
                <div key={index} className="p-4 border border-surface-200 rounded-lg space-y-3">
                  <Input
                    label="Room Name"
                    placeholder="e.g., Master Bedroom"
                    value={bed.roomName}
                    onChange={(e) => {
                      const newBeds = [...formData.beds.beds];
                      newBeds[index].roomName = e.target.value;
                      setFormData({
                        ...formData,
                        beds: { beds: newBeds },
                      });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-surface-900 mb-2">
                        Bed Type
                      </label>
                      <select
                        value={bed.bedType}
                        onChange={(e) => {
                          const newBeds = [...formData.beds.beds];
                          newBeds[index].bedType = e.target.value;
                          setFormData({
                            ...formData,
                            beds: { beds: newBeds },
                          });
                        }}
                        className="w-full px-4 py-2 border border-surface-300 rounded-lg"
                      >
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="queen">Queen</option>
                        <option value="king">King</option>
                        <option value="bunk">Bunk</option>
                      </select>
                    </div>
                    <Input
                      label="Quantity"
                      type="number"
                      placeholder="1"
                      value={bed.quantity}
                      onChange={(e) => {
                        const newBeds = [...formData.beds.beds];
                        newBeds[index].quantity = parseInt(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          beds: { beds: newBeds },
                        });
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newBeds = formData.beds.beds.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        beds: { beds: newBeds },
                      });
                    }}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    beds: {
                      beds: [
                        ...formData.beds.beds,
                        { roomName: '', bedType: 'double', quantity: 1 },
                      ],
                    },
                  });
                }}
              >
                + Add Bed
              </Button>
            </div>
          )}

          {currentStep === 'photos' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-600">Upload photos of your property. Max 10 MB per image.</p>
              <input ref={photoInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.length) handlePhotoUpload(e.target.files); }} />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="w-full border-2 border-dashed border-surface-300 rounded-xl p-8 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-colors disabled:opacity-60"
              >
                {photoUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-surface-600">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl mb-2">📸</p>
                    <p className="text-sm font-medium text-surface-900">Click to upload photos</p>
                    <p className="text-xs text-surface-500 mt-1">JPG, PNG, WebP — up to 10 MB each</p>
                  </>
                )}
              </button>
              {uploadedPhotoUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {uploadedPhotoUrls.map((url, i) => (
                    <div key={url} className="relative group rounded-lg overflow-hidden border border-surface-200 aspect-square">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Cover</span>
                      )}
                      <button
                        onClick={() => handleRemovePhoto(url)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'rules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Check-in Time"
                  type="time"
                  value={formData.rules.checkInTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rules: { ...formData.rules, checkInTime: e.target.value },
                    })
                  }
                />
                <Input
                  label="Check-out Time"
                  type="time"
                  value={formData.rules.checkOutTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rules: { ...formData.rules, checkOutTime: e.target.value },
                    })
                  }
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rules.smokingAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rules: { ...formData.rules, smokingAllowed: e.target.checked },
                    })
                  }
                />
                <span>Smoking Allowed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rules.petsAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rules: { ...formData.rules, petsAllowed: e.target.checked },
                    })
                  }
                />
                <span>Pets Allowed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rules.partiesAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rules: { ...formData.rules, partiesAllowed: e.target.checked },
                    })
                  }
                />
                <span>Parties Allowed</span>
              </label>
              <Input
                label="Additional Rules"
                placeholder="Any other rules for guests..."
                value={formData.rules.rules}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rules: { ...formData.rules, rules: e.target.value },
                  })
                }
              />
            </div>
          )}

          {currentStep === 'contact' && (
            <div className="space-y-4">
              <Input
                label="Contact Name"
                placeholder="Your name"
                value={formData.contact.contactName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, contactName: e.target.value },
                  })
                }
              />
              <Input
                label="Contact Phone"
                placeholder="+254 7XX XXX XXX"
                value={formData.contact.contactPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, contactPhone: e.target.value },
                  })
                }
              />
              <Input
                label="Contact Email"
                type="email"
                placeholder="your@email.com"
                value={formData.contact.contactEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, contactEmail: e.target.value },
                  })
                }
              />
            </div>
          )}

          {currentStep === 'group' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-600">
                Organize properties into groups (optional)
              </p>
              <Input
                label="Group Name"
                placeholder="e.g., Downtown Properties"
                value={formData.group.groupName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    group: { ...formData.group, groupName: e.target.value },
                  })
                }
              />
            </div>
          )}

          {currentStep === 'seasonal' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-600">
                Set seasonal pricing (optional)
              </p>
              <p className="text-xs text-surface-500">
                You can add seasonal pricing later. For now, your base price will be used.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
        >
          ← Previous
        </Button>

        {currentStepIndex === STEPS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Create Property
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next →
          </Button>
        )}
      </div>
    </div>
  );
}
