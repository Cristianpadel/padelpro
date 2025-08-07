"use client";

import React, { useState, useEffect } from 'react';
import type { User, Match } from '@/types';
import { getMockCurrentUser, getMockStudents } from '@/lib/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MatchChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  matchDetails: Match | null | undefined;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    timestamp: Date;
}

// Simple mock for chat messages
const generateMockMessages = (matchId: string, players: { userId: string, name?: string }[]): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    const currentUser = getMockCurrentUser();
    const students = getMockStudents();
    const allUsersInChat = [...(players || [])].map(p => students.find(s => s.id === p.userId) || { id: p.userId, name: p.name || 'Jugador', profilePictureUrl: ''});

    if (allUsersInChat.length > 1) {
        messages.push({
            id: `msg1-${matchId}`,
            userId: allUsersInChat[0]!.id,
            userName: allUsersInChat[0]!.name || 'Jugador 1',
            userAvatar: allUsersInChat[0]!.profilePictureUrl,
            text: `¡Buenas! ¿Listos para la partida?`,
            timestamp: new Date(new Date().getTime() - 10 * 60000)
        });
        messages.push({
            id: `msg2-${matchId}`,
            userId: allUsersInChat[1]!.id,
            userName: allUsersInChat[1]!.name || 'Jugador 2',
            userAvatar: allUsersInChat[1]!.profilePictureUrl,
            text: `¡Claro! Con ganas. ¿Alguien lleva bolas?`,
            timestamp: new Date(new Date().getTime() - 9 * 60000)
        });
        if (currentUser && allUsersInChat.some(u => u.id === currentUser.id) && !allUsersInChat.slice(0,2).some(u=> u.id === currentUser.id)) {
             messages.push({
                id: `msg3-${matchId}`,
                userId: currentUser.id,
                userName: currentUser.name || 'Tú',
                userAvatar: currentUser.profilePictureUrl,
                text: 'Yo llevo un bote nuevo.',
                timestamp: new Date(new Date().getTime() - 8 * 60000)
            });
        }
    }
    return messages;
};


const MatchChatDialog: React.FC<MatchChatDialogProps> = ({ isOpen, onOpenChange, matchDetails }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const currentUser = getMockCurrentUser();

  useEffect(() => {
    if (isOpen && matchDetails) {
      setMessages(generateMockMessages(matchDetails.id, matchDetails.bookedPlayers || []));
    }
  }, [isOpen, matchDetails]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !matchDetails) return;

    const messageToSend: ChatMessage = {
        id: `msg-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name || 'Tú',
        userAvatar: currentUser.profilePictureUrl,
        text: newMessage,
        timestamp: new Date(),
    };

    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');
  };

  if (!matchDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary"/> Chat de la Partida
          </DialogTitle>
          <DialogDescription>
            Comunícate con los demás jugadores.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow my-2 pr-4 -mr-4">
           <div className="space-y-4">
               {messages.map(msg => {
                   const isCurrentUser = msg.userId === currentUser?.id;
                   return (
                       <div key={msg.id} className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                           {!isCurrentUser && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.userAvatar} />
                                    <AvatarFallback>{getInitials(msg.userName)}</AvatarFallback>
                                </Avatar>
                           )}
                           <div className={cn(
                               "max-w-xs rounded-lg px-3 py-2 text-sm",
                               isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                           )}>
                               <p className="font-bold text-xs mb-0.5">{isCurrentUser ? "Tú" : msg.userName}</p>
                               <p>{msg.text}</p>
                           </div>
                           {isCurrentUser && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.userAvatar} />
                                    <AvatarFallback>{getInitials(msg.userName)}</AvatarFallback>
                                </Avatar>
                           )}
                       </div>
                   )
               })}
           </div>
        </ScrollArea>
        
        <DialogFooter className="mt-auto pt-4 border-t">
          <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              autoComplete="off"
            />
            <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchChatDialog;

    