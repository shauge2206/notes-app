"use client";

import { createContext, useContext } from "react";

interface EditorContextValue {
  tileId: string;
  sectionId: string;
}

const EditorContext = createContext<EditorContextValue>({ tileId: "", sectionId: "" });

export function EditorContextProvider({
  tileId,
  sectionId,
  children,
}: EditorContextValue & { children: React.ReactNode }) {
  return (
    <EditorContext.Provider value={{ tileId, sectionId }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return useContext(EditorContext);
}
