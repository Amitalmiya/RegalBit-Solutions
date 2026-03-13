import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createPostAPI } from '../services/postService.js';
import { addNewPost } from '../store/postSlice.js';

export default function CreatePost() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const fileRef   = useRef();

  const [preview,  setPreview]  = useState(null);
  const [file,     setFile]     = useState(null);
  const [caption,  setCaption]  = useState('');
  const [location, setLocation] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [step,     setStep]     = useState('select'); // 'select' | 'edit' | 'uploading'

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('edit');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setStep('edit');
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setStep('uploading');
    try {
      const formData = new FormData();
      formData.append('image',    file);
      formData.append('caption',  caption);
      formData.append('location', location);

      const res = await createPostAPI(formData);
      dispatch(addNewPost(res.data.post));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setStep('edit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {step !== 'select' && (
            <button onClick={() => { setStep('select'); setPreview(null); setFile(null); }}
              className="text-sm text-gray-500">
              ← Back
            </button>
          )}
          <h2 className="font-semibold text-base mx-auto">Create new post</h2>
          {step === 'edit' && (
            <button onClick={handleSubmit}
              className="text-blue-500 font-semibold text-sm">
              Share
            </button>
          )}
        </div>

        {/* Step: Select image */}
        {step === 'select' && (
          <div
            className="flex flex-col items-center justify-center py-20 cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current.click()}
          >
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-xl font-light mb-2">Drag photos and videos here</p>
            <p className="text-gray-500 text-sm mb-6">or</p>
            <button className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded">
              Select from computer
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {/* Step: Edit/Caption */}
        {(step === 'edit' || step === 'uploading') && (
          <div className="flex flex-col md:flex-row">
            {/* Image preview */}
            <div className="md:w-1/2 bg-black flex items-center">
              <img src={preview} alt="preview" className="w-full object-contain max-h-96" />
            </div>

            {/* Caption form */}
            <div className="md:w-1/2 p-4 flex flex-col gap-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                rows={5}
                className="w-full text-sm resize-none focus:outline-none border-b border-gray-200 pb-2"
              />
              <p className="text-right text-xs text-gray-400">{caption.length}/2,200</p>

              <input
                type="text"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-sm border-b border-gray-200 pb-2 focus:outline-none"
              />

              {step === 'uploading' && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
