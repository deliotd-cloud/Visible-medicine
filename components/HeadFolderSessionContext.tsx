'use client';
import {createContext,useContext} from 'react';
import type {createHeadFolderSession} from '../lib/head-folder-session';

export const HeadFolderSessionContext=createContext<ReturnType<typeof createHeadFolderSession>|null>(null);
export function useHeadFolderSession(){return useContext(HeadFolderSessionContext);}
