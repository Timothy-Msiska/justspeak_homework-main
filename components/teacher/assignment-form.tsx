'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface AssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  classCode: string; // ✅ Added classCode
}

// error map holds string messages per field
type AssignmentFormErrors = Partial<Record<keyof AssignmentFormData, string>>;

interface AssignmentFormProps {
  onSubmit: (data: AssignmentFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<AssignmentFormData>;
}

export function AssignmentForm({ onSubmit, isLoading = false, initialData }: AssignmentFormProps) {
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions || '',
    dueDate: initialData?.dueDate || '',
    maxScore: initialData?.maxScore || 100,
    classCode: initialData?.classCode || '', // ✅ Initialize classCode
  });

  const [errors, setErrors] = useState<AssignmentFormErrors>({});

  function validateForm() {
    const newErrors: AssignmentFormErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (formData.maxScore < 1) newErrors.maxScore = 'Max score must be at least 1';
    if (!formData.classCode.trim()) newErrors.classCode = 'Class code is required'; // ✅ Validate class code
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  }

  function handleChange(field: keyof AssignmentFormData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Create the assignment title and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Research Paper on Climate Change"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={isLoading}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the assignment"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isLoading}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Detailed instructions for students"
              rows={4}
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classCode">Class Code *</Label>
            <Input
              id="classCode"
              placeholder="Enter class code"
              value={formData.classCode}
              onChange={(e) => handleChange('classCode', e.target.value)}
              disabled={isLoading}
            />
            {errors.classCode && <p className="text-sm text-red-500">{errors.classCode}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Set due date and grading information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                disabled={isLoading}
              />
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxScore">Max Score</Label>
              <Input
                id="maxScore"
                type="number"
                min="1"
                max="1000"
                value={formData.maxScore}
                onChange={(e) => handleChange('maxScore', parseInt(e.target.value))}
                disabled={isLoading}
              />
              {errors.maxScore && <p className="text-sm text-red-500">{errors.maxScore}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Assignment'}
        </Button>
        <Button type="button" variant="outline" disabled={isLoading}>
          Save as Draft
        </Button>
      </div>
    </form>
  );
}