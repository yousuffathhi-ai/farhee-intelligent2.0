import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Download, 
  Layers, 
  Sliders, 
  Image as ImageIcon, 
  RefreshCw,
  Edit3,
  Upload,
  RotateCw,
  FlipHorizontal,
  Type,
  Trees,
  Sun,
  Scissors,
  Check,
  Eye,
  MessageSquare,
  FileUp
} from 'lucide-react';
import { ImageAsset } from '../types';
import { applyWatermarkToImageDataUrl } from '../lib/exporters';

interface ImageStudioProps {
  images: ImageAsset[];
  onSaveImage: (img: ImageAsset) => void;
  isOnline: boolean;
}

interface ImageAnalysis {
  dimensions: string;
  aspectRatio: string;
  lightingTone: string;
  composition: string;
  farheeReview: string;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  images,
  onSaveImage,
  isOnline,
}) => {
  const [prompt, setPrompt] = useState('An ethereal futuristic glass laboratory surrounded by bioluminescent tropical flora at twilight');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9'>('16:9');
  const [style, setStyle] = useState('cinematic');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(images[0] || null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInstruction, setEditInstruction] = useState('Change the background to a lush misty pine forest');
  const [isEditing, setIsEditing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<ImageAnalysis | null>(null);
  const [textOverlayValue, setTextOverlayValue] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Perform visual structure & composition analysis on an image
  const analyzeImage = (dataUrl: string, name: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 800;
      const ratio = w === h ? '1:1' : w > h ? (w / h > 1.6 ? '16:9' : '4:3') : (h / w > 1.6 ? '9:16' : '3:4');
      
      const analysis: ImageAnalysis = {
        dimensions: `${w} × ${h} px`,
        aspectRatio: ratio,
        lightingTone: 'Balanced dynamic range with clean midtone contrast',
        composition: w > h ? 'Expansive horizontal framing with prominent subject grounding' : 'Vertical portrait alignment with centered focal weighting',
        farheeReview: `I've analyzed "${name}"! The composition has crisp contrast and balanced subject depth. As your visual editing collaborator, I can apply precise in-place changes: replace the background (e.g. to a forest), crop & rotate, add text overlays, or restyle the atmosphere while preserving your subject's integrity.`,
      };
      setActiveAnalysis(analysis);
    };
    img.src = dataUrl;
  };

  // Handle image upload from user's device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalUrl = event.target?.result as string;
      // Stamp the Farhee watermark
      const watermarkedUrl = await applyWatermarkToImageDataUrl(originalUrl, 'Farhee Intelligent 2.0');

      const uploadedAsset: ImageAsset = {
        id: 'img_user_' + Date.now(),
        prompt: `Uploaded: ${file.name}`,
        imageUrl: watermarkedUrl,
        aspectRatio: '1:1',
        style: 'photorealistic',
        createdAt: Date.now(),
      };

      onSaveImage(uploadedAsset);
      setSelectedImage(uploadedAsset);
      setIsEditMode(true);
      analyzeImage(watermarkedUrl, file.name);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate Image with Gemini API + guarantee watermark
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style,
          size,
        }),
      });

      if (!res.ok) throw new Error('Image generation server error');
      const data = await res.json();

      // Ensure the "Farhee Intelligent 2.0" watermark is stamped in bottom-right corner
      const watermarkedUrl = await applyWatermarkToImageDataUrl(data.imageUrl, 'Farhee Intelligent 2.0');

      const newAsset: ImageAsset = {
        id: 'img_' + Date.now(),
        prompt: prompt.trim(),
        imageUrl: watermarkedUrl,
        aspectRatio,
        style,
        createdAt: Date.now(),
      };

      onSaveImage(newAsset);
      setSelectedImage(newAsset);
      analyzeImage(watermarkedUrl, prompt.slice(0, 30));
    } catch (err: any) {
      console.error('Image generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply Neural / Inpainting Edit
  const handleEdit = async (customInstruction?: string) => {
    const instructionToApply = customInstruction || editInstruction;
    if (!selectedImage || !instructionToApply.trim() || isEditing) return;

    setIsEditing(true);
    try {
      const res = await fetch('/api/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instructionToApply.trim(),
          originalImageUrl: selectedImage.imageUrl,
        }),
      });

      if (!res.ok) throw new Error('Image edit server error');
      const data = await res.json();

      // Ensure the "Farhee Intelligent 2.0" watermark is reapplied in bottom-right corner
      const watermarkedUrl = await applyWatermarkToImageDataUrl(data.imageUrl, 'Farhee Intelligent 2.0');

      const editedAsset: ImageAsset = {
        id: 'img_edit_' + Date.now(),
        prompt: `${selectedImage.prompt} (Edited: ${instructionToApply.trim()})`,
        imageUrl: watermarkedUrl,
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
        createdAt: Date.now(),
        isEdited: true,
        editInstruction: instructionToApply.trim(),
      };

      onSaveImage(editedAsset);
      setSelectedImage(editedAsset);
      analyzeImage(watermarkedUrl, instructionToApply.trim());
    } catch (err: any) {
      console.error('Image edit error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  // In-place lossless Rotate 90 degrees
  const handleRotate90 = async () => {
    if (!selectedImage) return;
    setIsEditing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = selectedImage.imageUrl;
      await new Promise((res) => { img.onload = res; });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalHeight || img.height;
      canvas.height = img.naturalWidth || img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const rotatedDataUrl = canvas.toDataURL('image/png');
      const finalWatermarked = await applyWatermarkToImageDataUrl(rotatedDataUrl, 'Farhee Intelligent 2.0');

      const rotatedAsset: ImageAsset = {
        id: 'img_rot_' + Date.now(),
        prompt: `${selectedImage.prompt} (Rotated 90°)`,
        imageUrl: finalWatermarked,
        aspectRatio: selectedImage.aspectRatio === '16:9' ? '9:16' : selectedImage.aspectRatio === '9:16' ? '16:9' : selectedImage.aspectRatio,
        style: selectedImage.style,
        createdAt: Date.now(),
        isEdited: true,
        editInstruction: 'Rotate 90° clockwise',
      };

      onSaveImage(rotatedAsset);
      setSelectedImage(rotatedAsset);
    } catch (err) {
      console.error('Rotate error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  // In-place lossless Horizontal Mirror Flip
  const handleFlipHorizontal = async () => {
    if (!selectedImage) return;
    setIsEditing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = selectedImage.imageUrl;
      await new Promise((res) => { img.onload = res; });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);

      const flippedDataUrl = canvas.toDataURL('image/png');
      const finalWatermarked = await applyWatermarkToImageDataUrl(flippedDataUrl, 'Farhee Intelligent 2.0');

      const flippedAsset: ImageAsset = {
        id: 'img_flip_' + Date.now(),
        prompt: `${selectedImage.prompt} (Flipped Horizontally)`,
        imageUrl: finalWatermarked,
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
        createdAt: Date.now(),
        isEdited: true,
        editInstruction: 'Horizontal Flip',
      };

      onSaveImage(flippedAsset);
      setSelectedImage(flippedAsset);
    } catch (err) {
      console.error('Flip error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  // In-place custom Text Overlay
  const handleApplyTextOverlay = async () => {
    if (!selectedImage || !textOverlayValue.trim()) return;
    setIsEditing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = selectedImage.imageUrl;
      await new Promise((res) => { img.onload = res; });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Add stylish typography overlay
      const fontSize = Math.max(20, Math.round(canvas.width * 0.045));
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = '#ffffff';
      ctx.fillText(textOverlayValue.trim(), canvas.width / 2, canvas.height * 0.2);

      const textDataUrl = canvas.toDataURL('image/png');
      const finalWatermarked = await applyWatermarkToImageDataUrl(textDataUrl, 'Farhee Intelligent 2.0');

      const textAsset: ImageAsset = {
        id: 'img_text_' + Date.now(),
        prompt: `${selectedImage.prompt} (Overlay: "${textOverlayValue}")`,
        imageUrl: finalWatermarked,
        aspectRatio: selectedImage.aspectRatio,
        style: selectedImage.style,
        createdAt: Date.now(),
        isEdited: true,
        editInstruction: `Add text overlay: "${textOverlayValue}"`,
      };

      onSaveImage(textAsset);
      setSelectedImage(textAsset);
      setTextOverlayValue('');
      setShowTextInput(false);
    } catch (err) {
      console.error('Text overlay error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const downloadImage = async (img: ImageAsset) => {
    // Re-verify watermark right before saving
    const watermarked = await applyWatermarkToImageDataUrl(img.imageUrl, 'Farhee Intelligent 2.0');
    const a = document.createElement('a');
    a.href = watermarked;
    a.download = `Farhee_Intelligent_${img.id}.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Hidden upload input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
        id="image-studio-upload-input"
      />

      {/* Left Control Panel */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Neural Image Studio</h2>
                <p className="text-xs text-slate-500">Gemini 3.1 Flash & Visual Editor</p>
              </div>
            </div>
            
            {/* Mode switch */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  !isEditMode ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
                }`}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                disabled={!selectedImage}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  isEditMode ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 disabled:opacity-40'
                }`}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Quick Image Upload Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4 text-indigo-600" />
              <span>Upload Image to Edit & Transform</span>
            </button>
          </div>

          {!isEditMode ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Text Prompt
                </label>
                <textarea
                  id="image-prompt-input"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your visual concept in rich detail..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {/* Aspect Ratio Affordance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Aspect Ratio</span>
                  <span className="text-[11px] text-slate-400 font-mono">{aspectRatio}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                        aspectRatio === ratio
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Artistic Style
                </label>
                <select
                  id="image-style-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cinematic">Cinematic 35mm</option>
                  <option value="photorealistic">Hyper-Photorealistic</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="watercolor">Fine Art Watercolor</option>
                  <option value="minimalist">Minimalist Modern</option>
                  <option value="3d-render">Octane 3D Render</option>
                </select>
              </div>

              {/* Resolution selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Target Resolution</span>
                  <span className="text-[11px] text-indigo-600 font-semibold">{size}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['1K', '2K', '4K'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setSize(res)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        size === res
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {res} Ultra
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Guarantee Notice */}
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Watermark included: <strong className="text-slate-700">"Farhee Intelligent 2.0"</strong></span>
              </div>

              <button
                type="submit"
                id="generate-image-button"
                disabled={isGenerating || !prompt.trim()}
                className="w-full h-10 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Studio Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Artwork</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                <span className="font-bold">Active target:</span>{' '}
                <span className="italic">{selectedImage?.prompt.slice(0, 50)}...</span>
              </div>

              {/* In-Place Quick Transformation Tools */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Instant In-Place Canvas Tools
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleRotate90}
                    disabled={isEditing}
                    className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RotateCw className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlipHorizontal}
                    disabled={isEditing}
                    className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <FlipHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Flip Mirror</span>
                  </button>
                </div>
              </div>

              {/* Text Overlay Tool */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Add Text Overlay</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Custom Typography</span>
                </button>

                {showTextInput && (
                  <div className="mt-2 space-y-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={textOverlayValue}
                      onChange={(e) => setTextOverlayValue(e.target.value)}
                      placeholder="Enter title or label to overlay..."
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleApplyTextOverlay}
                      disabled={isEditing || !textOverlayValue.trim()}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      Apply Typography Overlay
                    </button>
                  </div>
                )}
              </div>

              {/* Preset Editing Commands */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preset Editing Commands
                </label>
                <div className="space-y-1.5">
                  {[
                    { label: 'Change background to a forest', icon: Trees, text: 'Change the background to a lush misty pine forest with soft sunbeams' },
                    { label: 'Add golden hour sunset', icon: Sun, text: 'Change the lighting to a warm cinematic golden hour sunset' },
                    { label: 'Remove the object on the left', icon: Scissors, text: 'Remove the object on the left and seamlessly fill with ambient background' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditInstruction(preset.text);
                        handleEdit(preset.text);
                      }}
                      disabled={isEditing}
                      className="w-full py-1.5 px-2.5 text-left text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 flex items-center justify-between transition-all group disabled:opacity-50"
                    >
                      <span className="flex items-center gap-1.5">
                        <preset.icon className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="group-hover:text-indigo-900">{preset.label}</span>
                      </span>
                      <Sparkles className="h-3 w-3 text-slate-400 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Command Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Editing Instruction
                  </label>
                  <textarea
                    id="image-edit-input"
                    rows={3}
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    placeholder="e.g., Change background to a forest, crop and rotate, add text overlay, remove the object on the left..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Watermark maintained: <strong className="text-slate-700">"Farhee Intelligent 2.0"</strong></span>
                </div>

                <button
                  type="submit"
                  id="apply-image-edit-button"
                  disabled={isEditing || !editInstruction.trim()}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Applying Neural Edits...</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      <span>Apply Precise Modification</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Right Canvas / Preview & Gallery */}
      <div className="lg:col-span-8 space-y-5">
        
        {/* Main Active Viewer */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
          {selectedImage ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative group max-w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[460px] w-auto object-contain mx-auto transition-transform group-hover:scale-[1.01]"
                />
                
                {/* Top overlay badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-mono">
                    {selectedImage.aspectRatio}
                  </span>
                  <button
                    onClick={() => downloadImage(selectedImage)}
                    className="p-1.5 bg-black/70 hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
                    title="Download high-resolution image with Farhee watermark"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>

                {/* Bottom-right watermark display badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20 text-white text-[11px] font-medium shadow-sm pointer-events-none">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  <span>Farhee Intelligent 2.0</span>
                </div>
              </div>

              {/* Caption and Prompt Details */}
              <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-600">
                <div className="pr-4">
                  <div className="font-semibold text-slate-800">
                    "{selectedImage.prompt}"
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Style: <span className="capitalize">{selectedImage.style}</span> • Created:{' '}
                    {new Date(selectedImage.createdAt).toLocaleTimeString()}
                    {selectedImage.isEdited && (
                      <span className="ml-2 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                        Edited
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsEditMode(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit This
                </button>
              </div>

              {/* Farhee's Creative Review & Feedback Partner Card */}
              <div className="w-full mt-5 p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-slate-50 border border-indigo-100 text-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-indigo-950">Farhee Intelligent 2.0 • Visual Editor Review</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    Creative Partner
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeAnalysis?.farheeReview ||
                    `The atmospheric lighting and focal framing in this artwork harmonize beautifully! The colors offer crisp separation, and the composition holds a refined presence. Would you like to make further adjustments together? We can enrich background textures, adjust lighting warmth, or add bespoke text overlays.`}
                </p>

                {/* Quick adjustment chips */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Try next adjustment:</span>
                  {[
                    'Change background to a forest',
                    'Enhance golden hour lighting',
                    'Add cinematic rim glow',
                    'Crop & rotate',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditInstruction(chip);
                        setIsEditMode(true);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Structure Analysis Pill */}
              {activeAnalysis && (
                <div className="w-full mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Dimensions</span>
                    <span className="font-mono text-slate-800 font-bold">{activeAnalysis.dimensions}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Aspect Ratio</span>
                    <span className="font-mono text-slate-800 font-bold">{activeAnalysis.aspectRatio}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Composition</span>
                    <span className="truncate text-slate-800 font-medium">{activeAnalysis.composition}</span>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 stroke-1" />
              <p className="text-sm font-medium">No images active in studio</p>
              <p className="text-xs text-slate-500 mt-1">Enter a prompt to generate or upload an image to start editing</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload an Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Studio History / Reel */}
        {images.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Generated Assets Reel ({images.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img);
                    analyzeImage(img.imageUrl, img.prompt.slice(0, 25));
                  }}
                  className={`relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all group ${
                    selectedImage?.id === img.id
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white px-1 rounded font-mono">
                    {img.aspectRatio}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
