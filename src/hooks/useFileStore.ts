import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedReport {
  id: string;
  name: string;
  type: 'segmentation' | 'botijao' | 'genetic_projection' | 'uploaded';
  sourceId?: string; // ID da origem (fazenda, etc)
  data: any;
  metadata: {
    createdAt: string;
    size: number;
    description: string;
    filters?: any;
    settings?: any;
  };
  fileBlob?: Blob;
}

interface FileStore {
  reports: SavedReport[];
  addReport: (report: Omit<SavedReport, 'id'>) => void;
  removeReport: (id: string) => void;
  getReportsByType: (type: SavedReport['type']) => SavedReport[];
  clearReports: () => void;
}

// Create a separate store for blobs that doesn't persist
const blobStore = new Map<string, Blob>();

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      reports: [],
      
      addReport: (report) => {
        const newReport: SavedReport = {
          ...report,
          id: `${report.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        // Store blob separately if provided
        if (report.fileBlob) {
          blobStore.set(newReport.id, report.fileBlob);
          // Add a getter for the blob
          Object.defineProperty(newReport, 'fileBlob', {
            get: () => blobStore.get(newReport.id),
            enumerable: false,
            configurable: true
          });
        }
        
        set((state) => ({
          reports: [...state.reports, newReport]
        }));
        
        console.log('📄 Relatório salvo:', newReport.name, 'com blob:', !!report.fileBlob);
      },
      
      removeReport: (id) => {
        // Remove blob from memory store
        blobStore.delete(id);
        
        set((state) => ({
          reports: state.reports.filter(report => report.id !== id)
        }));
      },
      
      getReportsByType: (type) => {
        const reports = get().reports.filter(report => report.type === type);
        // Restore blob references
        return reports.map(report => {
          const blob = blobStore.get(report.id);
          if (blob) {
            Object.defineProperty(report, 'fileBlob', {
              get: () => blob,
              enumerable: false,
              configurable: true
            });
          }
          return report;
        });
      },
      
      clearReports: () => {
        // Clear all blobs
        blobStore.clear();
        set({ reports: [] });
      }
    }),
    {
      name: 'file-store',
      // Only persist the report metadata, not blobs
      partialize: (state) => ({
        reports: state.reports.map(report => ({
          ...report,
          fileBlob: undefined
        }))
      })
    }
  )
);