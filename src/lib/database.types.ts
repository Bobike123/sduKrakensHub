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
			notifications: {
				Row: {
					actor_id: string | null;
					created_at: string;
					id: string;
					kind: Database['public']['Enums']['notification_kind'];
					part_id: string | null;
					read_at: string | null;
					task_id: string | null;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					actor_id?: string | null;
					created_at?: string;
					id?: string;
					kind: Database['public']['Enums']['notification_kind'];
					part_id?: string | null;
					read_at?: string | null;
					task_id?: string | null;
					user_id: string;
				};
				Update: {
					actor_id?: string | null;
					created_at?: string;
					id?: string;
					kind?: Database['public']['Enums']['notification_kind'];
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
		};
		Views: {
			contribution_log: {
				Row: {
					at: string | null;
					dept: Database['public']['Enums']['dept'] | null;
					id: string | null;
					outcome: string | null;
					part_id: string | null;
					status: Database['public']['Enums']['task_status'] | null;
					task: string | null;
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
		};
		Enums: {
			dept: 'business' | 'mechanical' | 'electrical';
			notification_kind: 'task_assigned' | 'review_requested' | 'task_blocked' | 'part_assigned';
			step_owner: 'lead' | 'team';
			task_phase: 'planning' | 'work' | 'feedback';
			task_status: 'todo' | 'doing' | 'blocked' | 'review' | 'done' | 'failed';
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
			dept: ['business', 'mechanical', 'electrical'],
			notification_kind: ['task_assigned', 'review_requested', 'task_blocked', 'part_assigned'],
			step_owner: ['lead', 'team'],
			task_phase: ['planning', 'work', 'feedback'],
			task_status: ['todo', 'doing', 'blocked', 'review', 'done', 'failed']
		}
	}
} as const;
