export interface ConversationMessage {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface ConversationMemory {
  id: string;
  date: string;
  summary: string;
  keyTopics: string[];
  transcript?: string;
  messages: ConversationMessage[];
  durationSeconds?: number;
  lineCount?: number;
}

export interface Person {
  id: string;
  name: string;
  relationship: string;
  description: string;
  recentMemories: string[];
  conversations: ConversationMemory[];
  lastInteraction: string;
  email?: string;
  profileImage?: string;
  faceDescriptor?: number[];
  userId?: string;
}

import { useAuthStore } from "./authStore";

const STORAGE_KEY = "ai_guardian_people";

function _getAllRawPeople(): Person[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getAllPeople(): Person[] {
  const allRaw = _getAllRawPeople();
  const currentUserId = useAuthStore.getState().currentUser?.id;

  if (!currentUserId) return [];
  return allRaw.filter((p) => p.userId === currentUserId);
}

function _saveRawPeople(people: Person[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

export function addPerson(person: Omit<Person, "id">): Person {
  const allRaw = _getAllRawPeople();
  const currentUserId = useAuthStore.getState().currentUser?.id;

  const newPerson: Person = {
    ...person,
    id: crypto.randomUUID(),
    userId: currentUserId,
  };

  allRaw.push(newPerson);
  _saveRawPeople(allRaw);
  return newPerson;
}

export function updatePerson(id: string, updates: Partial<Person>) {
  const allRaw = _getAllRawPeople();
  const idx = allRaw.findIndex((p) => p.id === id);

  if (idx !== -1) {
    allRaw[idx] = { ...allRaw[idx], ...updates };
    _saveRawPeople(allRaw);
  }
  return allRaw[idx];
}

export function addConversation(
  personId: string,
  summary: string,
  topics: string[],
  messages: ConversationMessage[],
  durationSeconds?: number
) {
  const allRaw = _getAllRawPeople();
  const idx = allRaw.findIndex((p) => p.id === personId);

  if (idx !== -1) {
    const person = allRaw[idx];
    const convo: ConversationMemory = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      summary,
      keyTopics: topics,
      messages,
      lineCount: messages.length,
      durationSeconds,
    };

    person.conversations.unshift(convo);
    if (person.conversations.length > 50)
      person.conversations = person.conversations.slice(0, 50);
    person.lastInteraction = new Date().toISOString();

    _saveRawPeople(allRaw);
  }
}

export function getPersonById(id: string): Person | undefined {
  return getAllPeople().find((p) => p.id === id);
}

export function deletePerson(id: string) {
  const allRaw = _getAllRawPeople();
  const updatedRaw = allRaw.filter((p) => p.id !== id);
  _saveRawPeople(updatedRaw);
}
