export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			announcements: {
				Row: {
					body: string;
					created_at: string;
					created_by: string;
					id: string;
					tag: Database['public']['Enums']['announcement_tag'];
					title: string;
				};
				ComputedFields: never;
				Insert: {
					body: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					tag?: Database['public']['Enums']['announcement_tag'];
					title: string;
				};
				Update: {
					body?: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					tag?: Database['public']['Enums']['announcement_tag'];
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'announcements_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			assemblies: {
				Row: {
					agenda: string;
					created_at: string;
					created_by: string;
					held_on: string;
					id: string;
					status: Database['public']['Enums']['assembly_status'];
					summary: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					agenda: string;
					created_at?: string;
					created_by?: string;
					held_on: string;
					id?: string;
					status?: Database['public']['Enums']['assembly_status'];
					summary?: string;
					updated_at?: string;
				};
				Update: {
					agenda?: string;
					created_at?: string;
					created_by?: string;
					held_on?: string;
					id?: string;
					status?: Database['public']['Enums']['assembly_status'];
					summary?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'assemblies_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			assembly_approvals: {
				Row: {
					approved_at: string;
					assembly_id: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					approved_at?: string;
					assembly_id: string;
					user_id: string;
				};
				Update: {
					approved_at?: string;
					assembly_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'assembly_approvals_assembly_id_fkey';
						columns: ['assembly_id'];
						isOneToOne: false;
						referencedRelation: 'assemblies';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'assembly_approvals_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			boat_components: {
				Row: {
					created_at: string;
					detail: string;
					id: string;
					name: string;
					position: number;
					status: Database['public']['Enums']['component_status'];
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					detail?: string;
					id?: string;
					name: string;
					position?: number;
					status?: Database['public']['Enums']['component_status'];
				};
				Update: {
					created_at?: string;
					detail?: string;
					id?: string;
					name?: string;
					position?: number;
					status?: Database['public']['Enums']['component_status'];
				};
				Relationships: [];
			};
			chat_messages: {
				Row: {
					body: string;
					created_at: string;
					dept: Database['public']['Enums']['dept'];
					id: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					body: string;
					created_at?: string;
					dept: Database['public']['Enums']['dept'];
					id?: string;
					user_id?: string;
				};
				Update: {
					body?: string;
					created_at?: string;
					dept?: Database['public']['Enums']['dept'];
					id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'chat_messages_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			events: {
				Row: {
					created_at: string;
					created_by: string;
					description: string;
					id: string;
					place: string;
					starts_on: string;
					title: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					created_by?: string;
					description?: string;
					id?: string;
					place?: string;
					starts_on: string;
					title: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					description?: string;
					id?: string;
					place?: string;
					starts_on?: string;
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'events_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			idea_votes: {
				Row: {
					idea_id: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					idea_id: string;
					user_id: string;
				};
				Update: {
					idea_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'idea_votes_idea_id_fkey';
						columns: ['idea_id'];
						isOneToOne: false;
						referencedRelation: 'ideas';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'idea_votes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			ideas: {
				Row: {
					body: string;
					created_at: string;
					created_by: string;
					dept: Database['public']['Enums']['dept'] | null;
					id: string;
				};
				ComputedFields: never;
				Insert: {
					body: string;
					created_at?: string;
					created_by?: string;
					dept?: Database['public']['Enums']['dept'] | null;
					id?: string;
				};
				Update: {
					body?: string;
					created_at?: string;
					created_by?: string;
					dept?: Database['public']['Enums']['dept'] | null;
					id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'ideas_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			meeting_requests: {
				Row: {
					created_at: string;
					created_by: string;
					dept: Database['public']['Enums']['dept'];
					id: string;
					meet_at: string;
					meet_on: string;
					note: string;
					topic: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					created_by?: string;
					dept: Database['public']['Enums']['dept'];
					id?: string;
					meet_at: string;
					meet_on: string;
					note?: string;
					topic: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					dept?: Database['public']['Enums']['dept'];
					id?: string;
					meet_at?: string;
					meet_on?: string;
					note?: string;
					topic?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'meeting_requests_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			member_details: {
				Row: {
					dm_channel: Database['public']['Enums']['dm_channel'] | null;
					semester: number | null;
					studies: string;
					updated_at: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					dm_channel?: Database['public']['Enums']['dm_channel'] | null;
					semester?: number | null;
					studies?: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					dm_channel?: Database['public']['Enums']['dm_channel'] | null;
					semester?: number | null;
					studies?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'member_details_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			namebook: {
				Row: {
					contact: string;
					context: string;
					created_at: string;
					created_by: string;
					id: string;
					known_by: string;
					person: string;
				};
				ComputedFields: never;
				Insert: {
					contact?: string;
					context: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					known_by: string;
					person: string;
				};
				Update: {
					contact?: string;
					context?: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					known_by?: string;
					person?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'namebook_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'namebook_known_by_fkey';
						columns: ['known_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			notifications: {
				Row: {
					actor_id: string | null;
					assembly_id: string | null;
					created_at: string;
					id: string;
					kind: Database['public']['Enums']['notification_kind'];
					meeting_id: string | null;
					part_id: string | null;
					read_at: string | null;
					task_id: string | null;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					actor_id?: string | null;
					assembly_id?: string | null;
					created_at?: string;
					id?: string;
					kind: Database['public']['Enums']['notification_kind'];
					meeting_id?: string | null;
					part_id?: string | null;
					read_at?: string | null;
					task_id?: string | null;
					user_id: string;
				};
				Update: {
					actor_id?: string | null;
					assembly_id?: string | null;
					created_at?: string;
					id?: string;
					kind?: Database['public']['Enums']['notification_kind'];
					meeting_id?: string | null;
					part_id?: string | null;
					read_at?: string | null;
					task_id?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'notifications_actor_id_fkey';
						columns: ['actor_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'notifications_assembly_id_fkey';
						columns: ['assembly_id'];
						isOneToOne: false;
						referencedRelation: 'assemblies';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'notifications_meeting_id_fkey';
						columns: ['meeting_id'];
						isOneToOne: false;
						referencedRelation: 'meeting_requests';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'notifications_part_id_fkey';
						columns: ['part_id'];
						isOneToOne: false;
						referencedRelation: 'parts';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'notifications_task_id_fkey';
						columns: ['task_id'];
						isOneToOne: false;
						referencedRelation: 'contribution_log';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'notifications_task_id_fkey';
						columns: ['task_id'];
						isOneToOne: false;
						referencedRelation: 'tasks';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'notifications_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			onboarding_progress: {
				Row: {
					done_at: string;
					item: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					done_at?: string;
					item: string;
					user_id: string;
				};
				Update: {
					done_at?: string;
					item?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'onboarding_progress_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			openings: {
				Row: {
					created_at: string;
					created_by: string;
					description: string;
					id: string;
					looking_for: string;
					status: Database['public']['Enums']['opening_status'];
					title: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					created_by?: string;
					description?: string;
					id?: string;
					looking_for: string;
					status?: Database['public']['Enums']['opening_status'];
					title: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					description?: string;
					id?: string;
					looking_for?: string;
					status?: Database['public']['Enums']['opening_status'];
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'openings_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			part_members: {
				Row: {
					part_id: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					part_id: string;
					user_id: string;
				};
				Update: {
					part_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'part_members_part_id_fkey';
						columns: ['part_id'];
						isOneToOne: false;
						referencedRelation: 'parts';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'part_members_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			parts: {
				Row: {
					context: string;
					created_at: string;
					created_by: string;
					deadline: string | null;
					dept: Database['public']['Enums']['dept'];
					id: string;
					lead_id: string;
					name: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					context?: string;
					created_at?: string;
					created_by?: string;
					deadline?: string | null;
					dept: Database['public']['Enums']['dept'];
					id?: string;
					lead_id: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					context?: string;
					created_at?: string;
					created_by?: string;
					deadline?: string | null;
					dept?: Database['public']['Enums']['dept'];
					id?: string;
					lead_id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'parts_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'parts_lead_id_fkey';
						columns: ['lead_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			poll_options: {
				Row: {
					id: string;
					label: string;
					poll_id: string;
					position: number;
				};
				ComputedFields: never;
				Insert: {
					id?: string;
					label: string;
					poll_id: string;
					position: number;
				};
				Update: {
					id?: string;
					label?: string;
					poll_id?: string;
					position?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'poll_options_poll_id_fkey';
						columns: ['poll_id'];
						isOneToOne: false;
						referencedRelation: 'polls';
						referencedColumns: ['id'];
					}
				];
			};
			poll_votes: {
				Row: {
					option_id: string;
					poll_id: string;
					user_id: string;
					voted_at: string;
				};
				ComputedFields: never;
				Insert: {
					option_id: string;
					poll_id: string;
					user_id: string;
					voted_at?: string;
				};
				Update: {
					option_id?: string;
					poll_id?: string;
					user_id?: string;
					voted_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'poll_votes_option_fkey';
						columns: ['option_id', 'poll_id'];
						isOneToOne: false;
						referencedRelation: 'poll_options';
						referencedColumns: ['id', 'poll_id'];
					},
					{
						foreignKeyName: 'poll_votes_poll_id_fkey';
						columns: ['poll_id'];
						isOneToOne: false;
						referencedRelation: 'polls';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'poll_votes_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			polls: {
				Row: {
					created_at: string;
					created_by: string;
					id: string;
					is_open: boolean;
					question: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					created_by?: string;
					id?: string;
					is_open?: boolean;
					question: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					id?: string;
					is_open?: boolean;
					question?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'polls_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			profiles: {
				Row: {
					created_at: string;
					dept: Database['public']['Enums']['dept'];
					full_name: string;
					id: string;
					is_active: boolean;
					is_admin: boolean;
					must_change_password: boolean;
					role_title: string;
					username: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					dept: Database['public']['Enums']['dept'];
					full_name: string;
					id: string;
					is_active?: boolean;
					is_admin?: boolean;
					must_change_password?: boolean;
					role_title?: string;
					username: string;
				};
				Update: {
					created_at?: string;
					dept?: Database['public']['Enums']['dept'];
					full_name?: string;
					id?: string;
					is_active?: boolean;
					is_admin?: boolean;
					must_change_password?: boolean;
					role_title?: string;
					username?: string;
				};
				Relationships: [];
			};
			step_templates: {
				Row: {
					key: string;
					owner: Database['public']['Enums']['step_owner'];
					phase: Database['public']['Enums']['task_phase'];
					position: number;
					title: string;
				};
				ComputedFields: never;
				Insert: {
					key: string;
					owner: Database['public']['Enums']['step_owner'];
					phase: Database['public']['Enums']['task_phase'];
					position: number;
					title: string;
				};
				Update: {
					key?: string;
					owner?: Database['public']['Enums']['step_owner'];
					phase?: Database['public']['Enums']['task_phase'];
					position?: number;
					title?: string;
				};
				Relationships: [];
			};
			tasks: {
				Row: {
					assignee_id: string | null;
					blocked_reason: string | null;
					completed_at: string | null;
					created_at: string;
					created_by: string;
					dept: Database['public']['Enums']['dept'];
					description: string;
					due_date: string | null;
					id: string;
					outcome: string;
					part_id: string | null;
					phase: Database['public']['Enums']['task_phase'] | null;
					reviewer_id: string | null;
					status: Database['public']['Enums']['task_status'];
					step_key: string | null;
					title: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					assignee_id?: string | null;
					blocked_reason?: string | null;
					completed_at?: string | null;
					created_at?: string;
					created_by?: string;
					dept: Database['public']['Enums']['dept'];
					description?: string;
					due_date?: string | null;
					id?: string;
					outcome?: string;
					part_id?: string | null;
					phase?: Database['public']['Enums']['task_phase'] | null;
					reviewer_id?: string | null;
					status?: Database['public']['Enums']['task_status'];
					step_key?: string | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					assignee_id?: string | null;
					blocked_reason?: string | null;
					completed_at?: string | null;
					created_at?: string;
					created_by?: string;
					dept?: Database['public']['Enums']['dept'];
					description?: string;
					due_date?: string | null;
					id?: string;
					outcome?: string;
					part_id?: string | null;
					phase?: Database['public']['Enums']['task_phase'] | null;
					reviewer_id?: string | null;
					status?: Database['public']['Enums']['task_status'];
					step_key?: string | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'tasks_assignee_id_fkey';
						columns: ['assignee_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tasks_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tasks_part_id_fkey';
						columns: ['part_id'];
						isOneToOne: false;
						referencedRelation: 'parts';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tasks_reviewer_id_fkey';
						columns: ['reviewer_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tasks_step_key_fkey';
						columns: ['step_key'];
						isOneToOne: false;
						referencedRelation: 'step_templates';
						referencedColumns: ['key'];
					}
				];
			};
			tools: {
				Row: {
					created_at: string;
					created_by: string;
					id: string;
					item: string;
					owner_id: string;
					status: Database['public']['Enums']['tool_status'];
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					created_by?: string;
					id?: string;
					item: string;
					owner_id: string;
					status?: Database['public']['Enums']['tool_status'];
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					created_by?: string;
					id?: string;
					item?: string;
					owner_id?: string;
					status?: Database['public']['Enums']['tool_status'];
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'tools_created_by_fkey';
						columns: ['created_by'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tools_owner_id_fkey';
						columns: ['owner_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			contribution_log: {
				Row: {
					at: string | null;
					dept: Database['public']['Enums']['dept'];
					id: string;
					outcome: string;
					part_id: string | null;
					status: Database['public']['Enums']['task_status'];
					task: string;
					user_id: string | null;
				};
				ComputedFields: never;
				Insert: {
					at?: never;
					dept?: Database['public']['Enums']['dept'] | null;
					id?: string | null;
					outcome?: string | null;
					part_id?: string | null;
					status?: Database['public']['Enums']['task_status'] | null;
					task?: string | null;
					user_id?: string | null;
				};
				Update: {
					at?: never;
					dept?: Database['public']['Enums']['dept'] | null;
					id?: string | null;
					outcome?: string | null;
					part_id?: string | null;
					status?: Database['public']['Enums']['task_status'] | null;
					task?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'tasks_assignee_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tasks_part_id_fkey';
						columns: ['part_id'];
						isOneToOne: false;
						referencedRelation: 'parts';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Functions: {
			create_part: {
				Args: {
					p_context?: string;
					p_deadline?: string;
					p_dept: Database['public']['Enums']['dept'];
					p_lead_id: string;
					p_name: string;
					p_team?: string[];
				};
				Returns: string;
			};
			create_poll: { Args: { p_options: string[]; p_question: string }; Returns: string };
		};
		Enums: {
			announcement_tag: 'info' | 'urgent' | 'event';
			assembly_status: 'proposed' | 'planned' | 'cancelled';
			component_status: 'confirmed' | 'planned';
			dept: 'business' | 'mechanical' | 'electrical' | 'software';
			dm_channel: 'whatsapp' | 'teams' | 'email' | 'phone';
			notification_kind:
				| 'task_assigned'
				| 'review_requested'
				| 'task_blocked'
				| 'part_assigned'
				| 'meeting_requested'
				| 'assembly_proposed';
			opening_status: 'draft' | 'open' | 'closed';
			step_owner: 'lead' | 'team';
			task_phase: 'planning' | 'work' | 'feedback';
			task_status: 'todo' | 'doing' | 'blocked' | 'review' | 'done' | 'failed';
			tool_status: 'workshop' | 'borrowed' | 'home';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never) = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never) = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {
			announcement_tag: ['info', 'urgent', 'event'],
			assembly_status: ['proposed', 'planned', 'cancelled'],
			component_status: ['confirmed', 'planned'],
			dept: ['business', 'mechanical', 'electrical', 'software'],
			dm_channel: ['whatsapp', 'teams', 'email', 'phone'],
			notification_kind: [
				'task_assigned',
				'review_requested',
				'task_blocked',
				'part_assigned',
				'meeting_requested',
				'assembly_proposed'
			],
			opening_status: ['draft', 'open', 'closed'],
			step_owner: ['lead', 'team'],
			task_phase: ['planning', 'work', 'feedback'],
			task_status: ['todo', 'doing', 'blocked', 'review', 'done', 'failed'],
			tool_status: ['workshop', 'borrowed', 'home']
		}
	}
} as const;
