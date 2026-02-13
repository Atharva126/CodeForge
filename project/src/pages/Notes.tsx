import { useEffect, useState, useRef } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  Clock,
  Tag,
  Filter,
  ChevronDown,
  FileText,
  Calendar,
  Star,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load notes from Supabase
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Handle migration from localStorage if database is empty
      const savedNotes = localStorage.getItem(`notes_${user?.id}`);
      if ((!data || data.length === 0) && savedNotes) {
        const localNotes = JSON.parse(savedNotes);
        if (localNotes.length > 0) {
          console.log('Migrating local notes to Supabase...');
          const notesToInsert = localNotes.map((n: any) => ({
            user_id: user?.id,
            title: n.title,
            content: n.content,
            tags: n.tags || [],
            is_favorite: n.isFavorite || false,
            created_at: n.createdAt || new Date().toISOString(),
            updated_at: n.updatedAt || new Date().toISOString()
          }));

          const { data: migratedData, error: migrationError } = await supabase
            .from('user_notes')
            .insert(notesToInsert)
            .select();

          if (!migrationError) {
            setNotes((migratedData || []).map(transformNote));
            localStorage.removeItem(`notes_${user?.id}`);
            return;
          }
        }
      }

      const transformed = (data || []).map(transformNote);
      setNotes(transformed);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const transformNote = (dbNote: any): Note => ({
    id: dbNote.id,
    user_id: dbNote.user_id,
    title: dbNote.title,
    content: dbNote.content,
    tags: dbNote.tags || [],
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at,
    isFavorite: dbNote.is_favorite
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  const createNote = async () => {
    if (!user) {
      alert('You must be logged in to create notes.');
      return;
    }

    if (!editTitle.trim() && !editContent.trim()) {
      alert('Please enter a title or content for your note.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newNoteData = {
        user_id: user.id,
        title: editTitle.trim() || 'Untitled Note',
        content: editContent.trim(),
        tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        is_favorite: false
      };

      const { data, error } = await supabase
        .from('user_notes')
        .insert([newNoteData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const createdNote = transformNote(data);
        setNotes([createdNote, ...notes]);
        setSelectedNote(createdNote);
        setIsCreating(false);
        setEditTitle('');
        setEditContent('');
        setEditTags('');
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error('Error creating note:', err);
      alert(`Failed to create note: ${err.message || 'Unknown error'}. Make sure the user_notes table exists and you have permission.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateNote = async () => {
    if (selectedNote && user) {
      try {
        setIsSubmitting(true);
        const updatedData = {
          title: editTitle.trim() || 'Untitled Note',
          content: editContent.trim(),
          tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_notes')
          .update(updatedData)
          .eq('id', selectedNote.id)
          .eq('user_id', user.id);

        if (error) throw error;

        const updatedNote = {
          ...selectedNote,
          ...updatedData,
          updatedAt: updatedData.updated_at
        };

        setNotes(notes.map(n => n.id === selectedNote.id ? updatedNote : n));
        setSelectedNote(updatedNote);
        setIsEditing(false);
      } catch (err: any) {
        console.error('Error updating note:', err);
        alert(`Failed to update note: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const toggleFavorite = async (noteId: string) => {
    if (!user) return;
    const noteToToggle = notes.find(n => n.id === noteId);
    if (!noteToToggle) return;

    try {
      const nextFavorite = !noteToToggle.isFavorite;
      const { error } = await supabase
        .from('user_notes')
        .update({ is_favorite: nextFavorite })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(notes.map(note =>
        note.id === noteId ? { ...note, isFavorite: nextFavorite } : note
      ));
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, isFavorite: nextFavorite });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const startEditing = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setIsEditing(true);
  };

  const startCreating = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setIsCreating(true);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
  };

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !filterTag || note.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Notes</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} • {notes.filter(n => n.isFavorite).length} favorites
              </p>
            </div>
            <button
              onClick={startCreating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Note
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'title')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterTag('')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${!filterTag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  All Notes
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${filterTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || filterTag ? 'No notes found' : 'No notes yet. Create your first note!'}
                  </p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => !isEditing && setSelectedNote(note)}
                    className={`p-4 bg-white dark:bg-gray-800 border rounded-lg cursor-pointer transition-all ${selectedNote?.id === note.id
                      ? 'border-blue-500 dark:border-blue-400 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(note.id);
                          }}
                          className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                      {note.content}
                    </p>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {isEditing ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 flex-1"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={isCreating ? createNote : updateNote}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isCreating ? 'Creating...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{isCreating ? 'Create' : 'Save'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)..."
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-500"
                    />
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  placeholder="Start writing your note..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[400px] bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 resize-none"
                />
              </div>
            ) : selectedNote ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedNote.title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(selectedNote)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedNote.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedNote.content}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created: {formatDate(selectedNote.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Updated: {formatDate(selectedNote.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a note to view
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a note from the list or create a new one to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
