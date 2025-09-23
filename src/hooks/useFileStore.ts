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

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      reports: [],
      
      addReport: (report) => {
        const newReport: SavedReport = {
          ...report,
          id: `${report.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        set((state) => ({
          reports: [...state.reports, newReport]
        }));
      },
      
      removeReport: (id) => {
        set((state) => ({
          reports: state.reports.filter(report => report.id !== id)
        }));
      },
      
      getReportsByType: (type) => {
        return get().reports.filter(report => report.type === type);
      },
      
      clearReports: () => {
        set({ reports: [] });
      }
    }),
    {
      name: 'file-store',
      // Don't persist blobs to avoid storage issues
      partialize: (state) => ({
        reports: state.reports.map(report => ({
          ...report,
          fileBlob: undefined
        }))
      }),
    }
  )
);