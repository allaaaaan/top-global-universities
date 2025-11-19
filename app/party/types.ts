export interface Conversation {
  id: string;
  participants: [string, string]; // IDs of the two universities
  messages: { 
    text: string; 
    senderId: string; 
    timestamp: number;
  }[];
  status: 'active' | 'ending';
  lastActive: number;
}
