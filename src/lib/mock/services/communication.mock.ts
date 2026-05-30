import { delay, randomError } from '../utils';
import { mockChatMessages } from '../data/chat-messages';
import { mockAnnouncements } from '../data/announcements';
import { mockPolls } from '../data/polls';
import { mockVotes } from '../data/votes';
import { mockUsers } from '../data/users';
import { CreateAnnouncementDto, CreatePollDto } from '@/lib/types';

let chatMessages = [...mockChatMessages];
let announcements = [...mockAnnouncements];
let polls = [...mockPolls];
let votes = [...mockVotes];

export const communicationMock = {
  // Chat
  getChatMessages: async (mahberId: string) => {
    await delay(500);
    const data = chatMessages
      .filter(m => m.mahber_id === mahberId && !m.is_deleted)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return {
      data,
      meta: { total: data.length, page: 1, limit: 50, totalPages: 1 },
    };
  },

  sendChatMessage: async (mahberId: string, content: string) => {
    await delay(300);
    const newMessage = {
      id: `msg_${Date.now()}`,
      mahber_id: mahberId,
      sender_id: mockUsers[2].id, // Simulating a message from user 3 (the logged-in mock user)
      content,
      is_deleted: false,
      created_at: new Date().toISOString(),
      sender: mockUsers[2],
      read_by_count: 0,
      is_read_by_me: true,
    };
    chatMessages = [...chatMessages, newMessage];
    return newMessage;
  },

  markMessagesAsRead: async (mahberId: string, messageIds: string[]) => {
    await delay(300);
    let marked = 0;
    chatMessages = chatMessages.map(m => {
      if (m.mahber_id === mahberId && messageIds.includes(m.id)) {
        if (!m.is_read_by_me && m.sender_id !== mockUsers[2].id) {
          marked++;
          return {
            ...m,
            is_read_by_me: true,
            read_by_count: m.read_by_count + 1,
          };
        }
      }
      return m;
    });
    return { marked };
  },

  getUnreadCount: async (mahberId: string) => {
    await delay(200);
    const unread = chatMessages.filter(
      m => m.mahber_id === mahberId && !m.is_deleted && m.sender_id !== mockUsers[2].id && !m.is_read_by_me
    );
    return { unread_count: unread.length };
  },

  getReadReceipts: async (mahberId: string, messageId: string) => {
    await delay(300);
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg || msg.read_by_count === 0) {
      return [];
    }
    
    const receipts = [];
    if (msg.read_by_count >= 1) {
      receipts.push({
        member_id: mockUsers[0].id,
        member_name: mockUsers[0].name,
        read_at: new Date(new Date(msg.created_at).getTime() + 60000).toISOString(),
      });
    }
    if (msg.read_by_count >= 2) {
      receipts.push({
        member_id: mockUsers[1].id,
        member_name: mockUsers[1].name,
        read_at: new Date(new Date(msg.created_at).getTime() + 120000).toISOString(),
      });
    }
    return receipts;
  },

  // Announcements
  getAnnouncements: async (mahberId: string) => {
    await delay(600);
    const data = announcements
      .filter(a => a.mahber_id === mahberId && a.is_published)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  createAnnouncement: async (mahberId: string, data: CreateAnnouncementDto) => {
    await delay(800);
    randomError(0.05);
    const newAnnouncement = {
      id: `ann_${Date.now()}`,
      mahber_id: mahberId,
      title: data.title,
      content: data.content,
      priority: data.priority,
      target_audience: data.target_audience,
      scheduled_at: data.scheduled_at,
      is_published: true,
      created_by: mockUsers[0].id, // Mocked as created by admin
      created_at: new Date().toISOString(),
      creator: mockUsers[0],
      reads: [],
    };
    announcements = [newAnnouncement, ...announcements];
    return newAnnouncement;
  },

  markAnnouncementAsRead: async (mahberId: string, announcementId: string) => {
    await delay(400);
    const readRecord = {
      id: `rd_${Date.now()}`,
      announcement_id: announcementId,
      member_id: mockUsers[2].id,
      read_at: new Date().toISOString()
    };
    const announcement = announcements.find(a => a.id === announcementId);
    if (announcement) {
      if (!announcement.reads) announcement.reads = [];
      announcement.reads.push(readRecord);
    }
    return readRecord;
  },

  // Polls
  getPolls: async (mahberId: string) => {
    await delay(700);
    const data = polls
      .filter(p => p.mahber_id === mahberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  createPoll: async (mahberId: string, data: CreatePollDto) => {
    await delay(800);
    randomError(0.05);
    const newPoll = {
      id: `pol_${Date.now()}`,
      mahber_id: mahberId,
      question: data.question,
      options: data.options.map((opt, i) => ({ id: `opt_${Date.now()}_${i}`, text: opt })),
      poll_type: data.poll_type,
      voting_deadline: data.voting_deadline,
      eligibility_criteria: data.eligibility_criteria,
      is_closed: false,
      created_by: mockUsers[0].id,
      created_at: new Date().toISOString(),
      creator: mockUsers[0],
      votes: [],
    };
    polls = [newPoll, ...polls];
    return newPoll;
  },

  vote: async (mahberId: string, pollId: string, choices: string[]) => {
    await delay(600);
    const poll = polls.find(p => p.id === pollId && p.mahber_id === mahberId);
    if (!poll) throw new Error('Poll not found');
    if (poll.is_closed) throw new Error('Poll is closed');
    
    // Check if user already voted (mocked as user 3)
    const existingVote = poll.votes?.find(v => v.member_id === mockUsers[2].id);
    if (existingVote) throw new Error('Already voted');

    const newVote = {
      id: `vot_${Date.now()}`,
      poll_id: pollId,
      member_id: mockUsers[2].id,
      choices,
      created_at: new Date().toISOString(),
    };
    
    votes = [...votes, newVote];
    if (!poll.votes) poll.votes = [];
    poll.votes.push(newVote);
    
    return newVote;
  },

  voteUpsert: async (mahberId: string, pollId: string, choices: string[]) => {
    await delay(600);
    const poll = polls.find(p => p.id === pollId && p.mahber_id === mahberId);
    if (!poll) throw new Error('Poll not found');
    if (poll.is_closed) throw new Error('Poll is closed');

    const deadline = poll.voting_deadline ? new Date(poll.voting_deadline) : null;
    if (deadline && deadline.getTime() <= Date.now()) throw new Error('Poll is closed');

    if (!poll.votes) poll.votes = [];
    const existingVote = poll.votes.find(v => v.member_id === mockUsers[2].id);
    if (existingVote) {
      existingVote.choices = choices;
      return existingVote;
    }

    const newVote = {
      id: `vot_${Date.now()}`,
      poll_id: pollId,
      member_id: mockUsers[2].id,
      choices,
      created_at: new Date().toISOString(),
    };
    votes = [...votes, newVote];
    poll.votes.push(newVote);
    return newVote;
  },

  getPollResults: async (mahberId: string, pollId: string) => {
    await delay(500);
    const poll = polls.find(p => p.id === pollId && p.mahber_id === mahberId);
    if (!poll) throw new Error('Poll not found');

    const totalVotes = poll.votes?.length || 0;
    
    // Basic counting for first round
    const counts: Record<string, number> = {};
    poll.options.forEach(opt => counts[opt.id] = 0);
    poll.votes?.forEach(vote => {
      if (vote.choices && vote.choices.length > 0) {
        counts[vote.choices[0]] = (counts[vote.choices[0]] || 0) + 1;
      }
    });

    const baseResults = poll.options.map(opt => ({
      option_id: opt.id,
      option_text: opt.text,
      vote_count: counts[opt.id] || 0,
    }));

    const response: any = {
      poll_id: poll.id,
      poll_type: poll.poll_type,
      total_votes: totalVotes,
      results: baseResults,
    };

    if (poll.poll_type === 'RANKED_CHOICE') {
      // Fake IRV logic for the mock
      response.irv_rounds = [
        {
          round: 1,
          counts: { ...counts },
          eliminated: [poll.options[1]?.id || 'opt_2'], // Mock eliminated
        },
        {
          round: 2,
          counts: { 
            [poll.options[0]?.id || 'opt_1']: (counts[poll.options[0]?.id || 'opt_1'] || 0) + (counts[poll.options[1]?.id || 'opt_2'] || 0),
            [poll.options[2]?.id || 'opt_3']: counts[poll.options[2]?.id || 'opt_3'] || 0
          },
          eliminated: [poll.options[0]?.id || 'opt_1'],
          winner: poll.options[2]?.id || 'opt_3'
        }
      ];
    }

    return response;
  },
};
