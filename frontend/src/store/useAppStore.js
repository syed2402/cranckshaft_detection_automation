import { create } from "zustand";

export const useAppStore = create((set) => ({
  currentProfile: null,
  currentFeatures: null,
  currentDecision: null,
  uploadedFile: null,
  processingStatus: "idle",
  errorMessage: "",
  allProfiles: [],
  trendData: [],
  layerVisibility: { l1: true, l2: false, l3: true, l4: true, l5: true, l6: true, l7: true },
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  setCurrentFeatures: (features) => set({ currentFeatures: features }),
  setCurrentDecision: (decision) => set({ currentDecision: decision }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setLayerVisibility: (layer, visible) =>
    set((state) => ({ layerVisibility: { ...state.layerVisibility, [layer]: visible } })),
  setAllProfiles: (profiles) => set({ allProfiles: profiles }),
  setTrendData: (data) => set({ trendData: data }),
  reset: () =>
    set({
      currentProfile: null,
      currentFeatures: null,
      currentDecision: null,
      uploadedFile: null,
      processingStatus: "idle",
      errorMessage: "",
    }),
}));
