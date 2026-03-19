import React, { useEffect, useState } from 'react';
import { X, Clock, RotateCcw, Loader2 } from 'lucide-react';
import { Note } from '@/lib/types';
import { getNoteVersions } from '@/lib/db';

interface VersionHistoryModalProps {
  note: Note;
  onClose: () => void;
  onRestore: (noteId: string, content: string) => void;
}

export default function VersionHistoryModal({ note, onClose, onRestore }: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      const data = await getNoteVersions(note.id);
      setVersions(data);
      setLoading(false);
    }
    fetchVersions();
  }, [note.id]);

  const handleRestore = async (versionId: string, content: string) => {
    setRestoringId(versionId);
    await onRestore(note.id, content);
    setRestoringId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-800">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No previous versions found for this note.
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-500">
                      {new Date(version.created_at).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleRestore(version.id, version.content)}
                      disabled={restoringId !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {restoringId === version.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Restore
                    </button>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-40 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: version.content }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
