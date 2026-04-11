/**
 * Team Management — Prisma schema additions
 * Adds Team, TeamMember, and shared Campaign access models.
 */

// Add these to prisma/schema.prisma:

export const TEAM_SCHEMA_ADDITIONS = `

enum TeamRole {
  ADMIN
  MANAGER
  VIEWER
}

model Team {
  id          String         @id @default(cuid())
  name        String
  description String?
  ownerId     String         // User ID of team owner
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  members     TeamMember[]
  campaigns   CampaignTeam[]
}

model TeamMember {
  id        String    @id @default(cuid())
  teamId    String
  userId    String
  role      TeamRole  @default(VIEWER)
  invitedAt DateTime  @default(now())
  joinedAt  DateTime?
  team      Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
}

model CampaignTeam {
  id         String   @id @default(cuid())
  campaignId String
  teamId     String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  team       Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([campaignId, teamId])
  @@index([campaignId])
  @@index([teamId])
}
`

export interface TeamMemberData {
  id: string
  userId: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  joinedAt: string
  status: 'active' | 'invited'
}

export interface TeamData {
  id: string
  name: string
  description: string | null
  ownerId: string
  members: TeamMemberData[]
  sharedCampaigns: number
  createdAt: string
}

// In-memory store (replace with Prisma)
const teams = new Map<string, TeamData>()
const invitations = new Map<string, unknown>()

export function createTeam(ownerId: string, name: string, description?: string): TeamData {
  const team: TeamData = {
    id: `team-${Date.now()}`,
    name,
    description: description || null,
    ownerId,
    members: [{
      id: 'member-1',
      userId: ownerId,
      name: 'Team Owner',
      email: 'owner@example.com',
      role: 'admin',
      joinedAt: new Date().toISOString(),
      status: 'active',
    }],
    sharedCampaigns: 0,
    createdAt: new Date().toISOString(),
  }
  teams.set(team.id, team)
  return team
}

export function inviteMember(teamId: string, email: string, role: 'manager' | 'viewer'): boolean {
  const team = teams.get(teamId)
  if (!team) return false

  invitations.set(`inv-${Date.now()}`, { teamId, email, role })
  return true
}

export function getTeamMembers(teamId: string): TeamMemberData[] {
  return teams.get(teamId)?.members || []
}

export function updateMemberRole(teamId: string, memberId: string, role: 'admin' | 'manager' | 'viewer'): boolean {
  const team = teams.get(teamId)
  if (!team) return false
  const member = team.members.find(m => m.id === memberId)
  if (!member) return false
  member.role = role
  return true
}

export function removeMember(teamId: string, memberId: string): boolean {
  const team = teams.get(teamId)
  if (!team) return false
  team.members = team.members.filter(m => m.id !== memberId)
  return true
}
