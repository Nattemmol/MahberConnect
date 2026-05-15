import { delay, randomError } from "../utils";
import { mockMahbers, mockMemberships } from "../data/mahbers";
import { CreateMahberDto, JoinRequest } from "@/lib/types";

export const mahberMock = {
  getMahbers: async () => {
    await delay(600);
    randomError(0.05);
    return mockMahbers;
  },

  getPublicMahbers: async () => {
    await delay(800);
    // Return mahbers not already in user's memberships for discovery
    const myMahberIds = mockMemberships.map((m) => m.mahber_id);
    return mockMahbers.filter(
      (m) => m.is_public && !myMahberIds.includes(m.id),
    );
  },

  createMahber: async (data: CreateMahberDto) => {
    await delay(1000);
    randomError(0.1);

    const newMahber = {
      id: `mah_${Math.random().toString(36).substring(7)}`,
      name: data.name,
      type: data.type,
      is_public: data.is_public,
      invitation_code: data.invitation_code ?? null,
      configuration: data.configuration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _count: { members: 1 },
    };

    return newMahber;
  },

  getMahberById: async (id: string) => {
    await delay(400);
    const mahber = mockMahbers.find((m) => m.id === id);
    if (!mahber) throw new Error("Mahber not found");
    return mahber;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  joinMahber: async (id: string, data?: { invitation_code?: string }) => {
    await delay(800);
    const joinRequest: JoinRequest = {
      id: `jr_${Math.random().toString(36).substring(7)}`,
      mahber_id: id,
      user_id: "usr_3",
      status: "Pending",
      invitation_code: data?.invitation_code ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return joinRequest;
  },
};
