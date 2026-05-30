import { delay, randomError } from "../utils";
import { mockMemberDetails } from "../data/memberships";
import { mockJoinRequests } from "../data/join-requests";
import { MemberDetail, UpdateRoleDto, JoinRequestActionDto, BatchProcessItem } from "@/lib/types";
import { DEFAULT_MAHBER_ROLES } from "@/lib/utils/permissions";
import { SuspendMemberParams } from "@/lib/types";

// In-memory state so actions persist during session
let members = [...mockMemberDetails];
let joinRequests = [...mockJoinRequests];

export const memberMock = {
  getMahberRoles: async (_mahberId: string) => {
    await delay(300);
    return DEFAULT_MAHBER_ROLES;
  },

  getMembers: async (mahberId: string, page = 1, limit = 20) => {
    await delay(600);
    const filtered = members.filter((m) => m.mahber_id === mahberId);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = filtered.slice(startIndex, endIndex);
    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  },

  getMemberById: async (mahberId: string, memberId: string) => {
    await delay(400);
    const member = members.find(
      (m) => m.mahber_id === mahberId && m.id === memberId,
    );
    if (!member) throw new Error("Member not found");
    return member;
  },

  suspendMember: async (mahberId: string, memberId: string, params?: SuspendMemberParams) => {
    await delay(800);
    randomError(0.05);
    const member = members.find(
      (m) => m.mahber_id === mahberId && m.id === memberId,
    );
    if (!member) throw new Error("Member not found");
    if (member.status === "Suspended") throw new Error("Member is already suspended");
    member.status = "Suspended";
    member.suspended_until = params?.duration_days
      ? new Date(Date.now() + params.duration_days * 86400000).toISOString()
      : null;
    member.suspension_reason = params?.reason ?? null;
    member.updated_at = new Date().toISOString();
    return member;
  },

  reinstateMember: async (mahberId: string, memberId: string) => {
    await delay(800);
    randomError(0.05);
    const member = members.find(
      (m) => m.mahber_id === mahberId && m.id === memberId,
    );
    if (!member) throw new Error("Member not found");
    member.status = "Active";
    member.suspended_until = null;
    member.suspension_reason = null;
    member.updated_at = new Date().toISOString();
    return member;
  },

  unbanMember: async (mahberId: string, memberId: string) => {
    await delay(800);
    randomError(0.05);
    const member = members.find(
      (m) => m.mahber_id === mahberId && (m.id === memberId || m.member_id === memberId),
    );
    if (!member) throw new Error("Member not found");
    member.status = "Active";
    member.updated_at = new Date().toISOString();
    return member;
  },

  updateMemberRole: async (
    mahberId: string,
    memberId: string,
    data: UpdateRoleDto,
  ) => {
    await delay(700);
    randomError(0.05);
    const member = members.find(
      (m) => m.mahber_id === mahberId && m.id === memberId,
    );
    if (!member) throw new Error("Member not found");

    // Simulate role limit enforcement
    const { mockMahbers } = require("../data/mahbers");
    const mahber = mockMahbers.find((m: any) => m.id === mahberId);
    const roleLimits = mahber?.configuration?.role_limits as Record<string, number> | undefined;
    if (roleLimits && data.role_name in roleLimits) {
      const limit = roleLimits[data.role_name];
      const currentCount = members.filter(
        (m) => m.mahber_id === mahberId && m.status === "Active" && m.role_name === data.role_name && m.id !== memberId,
      ).length;
      if (currentCount >= limit) {
        throw {
          response: {
            data: {
              statusCode: 400,
              message: `Role limit exceeded: maximum ${limit} member(s) can have the "${data.role_name}" role`,
            },
          },
        };
      }
    }

    member.role_name = data.role_name;
    if (data.custom_permissions) {
      member.permissions = data.custom_permissions;
    } else {
      const preset = DEFAULT_MAHBER_ROLES.find((r) => r.name === data.role_name);
      member.permissions = preset?.permissions ?? [];
    }
    member.updated_at = new Date().toISOString();
    return member;
  },

  removeMember: async (mahberId: string, memberId: string) => {
    await delay(800);
    randomError(0.05);
    members = members.filter(
      (m) => !(m.mahber_id === mahberId && m.id === memberId),
    );
    return { message: "Member removed successfully" };
  },

  getJoinRequests: async (mahberId: string) => {
    await delay(600);
    return joinRequests.filter((jr) => jr.mahber_id === mahberId);
  },

  handleJoinRequest: async (
    mahberId: string,
    requestId: string,
    data: JoinRequestActionDto,
  ) => {
    await delay(800);
    randomError(0.05);
    const request = joinRequests.find(
      (jr) => jr.id === requestId && jr.mahber_id === mahberId,
    );
    if (!request) throw new Error("Join request not found");
    request.status = data.action === "approve" ? "Approved" : "Rejected";
    if (data.rejection_reason) request.rejection_reason = data.rejection_reason;
    request.updated_at = new Date().toISOString();
    return request;
  },

  batchHandleJoinRequests: async (mahberId: string, items: BatchProcessItem[]) => {
    await delay(1000);
    const results = { approved: 0, rejected: 0, failed: [] as { requestId: string; reason: string }[] };

    for (const item of items) {
      const request = joinRequests.find(
        (jr) => jr.id === item.requestId && jr.mahber_id === mahberId,
      );

      if (!request) {
        results.failed.push({ requestId: item.requestId, reason: "Join request not found" });
        continue;
      }

      if (request.status !== "Pending") {
        results.failed.push({
          requestId: item.requestId,
          reason: `Only pending join requests can be processed (current: ${request.status})`,
        });
        continue;
      }

      request.status = item.action === "approve" ? "Approved" : "Rejected";
      if (item.rejection_reason) request.rejection_reason = item.rejection_reason;
      request.updated_at = new Date().toISOString();

      if (item.action === "approve") results.approved++;
      else results.rejected++;
    }

    return results;
  },
};
