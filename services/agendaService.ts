import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AgendaEntry, AgendaEntryCreateInput } from '../types/agenda';
import { supabase } from './supabase';

const AGENDA_KEY_PREFIX = 'hometaste:agenda:';

function agendaKey(userId: string) {
  return `${AGENDA_KEY_PREFIX}${userId}`;
}

async function getUserIdOrThrow() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');
  return userId;
}

function sortEntries(entries: AgendaEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.done_on === b.done_on) {
      return b.created_at.localeCompare(a.created_at);
    }
    return b.done_on.localeCompare(a.done_on);
  });
}

export const agendaService = {
  async listMyEntries(): Promise<AgendaEntry[]> {
    const userId = await getUserIdOrThrow();
    const raw = await AsyncStorage.getItem(agendaKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AgendaEntry[];
    return sortEntries(parsed);
  },

  async addMyEntry(input: AgendaEntryCreateInput): Promise<AgendaEntry> {
    const userId = await getUserIdOrThrow();
    const current = await this.listMyEntries();

    const entry: AgendaEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      recipe_id: input.recipe_id,
      recipe_title: input.recipe_title,
      done_on: input.done_on,
      calories: input.calories,
      created_at: new Date().toISOString(),
    };

    const next = sortEntries([entry, ...current]);
    await AsyncStorage.setItem(agendaKey(userId), JSON.stringify(next));
    return entry;
  },

  async deleteMyEntry(entryId: string): Promise<void> {
    const userId = await getUserIdOrThrow();
    const current = await this.listMyEntries();
    const next = current.filter((e) => e.id !== entryId);
    await AsyncStorage.setItem(agendaKey(userId), JSON.stringify(next));
  },
};
