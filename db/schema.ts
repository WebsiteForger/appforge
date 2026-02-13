import { pgTable, text, uuid, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),                    // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  githubToken: text('github_token'),              // Encrypted GitHub PAT
  plan: text('plan').default('free'),             // free | pro
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  template: text('template').default('react-netlify'),

  // GitHub
  githubRepo: text('github_repo'),                // "username/appforge-project-name"
  githubBranch: text('github_branch').default('main'),

  // Netlify deployment
  netlifySiteId: text('netlify_site_id'),
  netlifyUrl: text('netlify_url'),
  lastDeployedAt: timestamp('last_deployed_at'),
  deployStatus: text('deploy_status'),            // idle | building | live | failed

  // Metadata
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  messages: jsonb('messages').default([]),         // Array of {role, content, timestamp}
  tokensUsed: integer('tokens_used').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
