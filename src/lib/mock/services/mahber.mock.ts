import { delay, randomError } from "../utils";
import { mockMahbers, mockMemberships } from "../data/mahbers";
import { mockPayments } from "../data/financial";
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

  joinMahberSubsystem: async (id: string) => {
    await delay(1000);
    const mahber = mockMahbers.find((m) => m.id === id);
    if (!mahber) throw new Error("Mahber not found");

    const joinFeeRequired = mahber.configuration?.join_fee_required ?? (mahber.type === "EQUB" || mahber.id === "mah_1");
    const joinFeeAmount = mahber.configuration?.join_fee_amount ?? 150;

    if (joinFeeRequired) {
      const tx_ref = `tx_join_${Date.now()}`;
      
      // Store in mock payments for callback verification
      mockPayments.push({
        id: `pay_join_${Date.now()}`,
        user_id: 'usr_1',
        mahber_id: id,
        amount: joinFeeAmount,
        payment_type: 'JoinFee',
        status: 'Pending',
        tx_ref,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return {
        paymentRequired: true,
        amount: joinFeeAmount,
        currency: "ETB",
        paymentUrl: `/payment/callback?tx_ref=${tx_ref}&status=success`,
        token: tx_ref,
      };
    } else {
      mockMemberships.push({
        id: `mem_${Math.random().toString(36).substring(7)}`,
        user_id: "usr_1",
        mahber_id: id,
        role: "MEMBER",
        joined_at: new Date().toISOString(),
        mahber,
      });

      return {
        paymentRequired: false,
        message: "Successfully joined Mahber",
        active: true,
      };
    }
  },

  updateMahber: async (id: string, data: any) => {
    await delay(1000);
    const index = mockMahbers.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Mahber not found");
    
    mockMahbers[index] = {
      ...mockMahbers[index],
      ...data,
      configuration: {
        ...mockMahbers[index].configuration,
        ...data.configuration,
      },
      updated_at: new Date().toISOString(),
    };
    
    return mockMahbers[index];
  },

  deleteMahber: async (id: string) => {
    await delay(1000);
    const index = mockMahbers.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Mahber not found");
    mockMahbers.splice(index, 1);
  },

  inviteMember: async (mahberId: string, phone: string) => {
    await delay(800);
    const joinRequest: JoinRequest = {
      id: `jr_${Math.random().toString(36).substring(7)}`,
      mahber_id: mahberId,
      user_id: "usr_3",
      status: "Pending",
      is_invitation: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return joinRequest;
  },

  getInvitations: async () => {
    await delay(500);
    return [];
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  respondToInvitation: async (requestId: string, action: "accept" | "reject") => {
    await delay(800);
    const joinRequest: JoinRequest = {
      id: requestId,
      mahber_id: "mah_1",
      user_id: "usr_1",
      status: action === "accept" ? "Approved" : "Rejected",
      is_invitation: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return joinRequest;
  },
};
