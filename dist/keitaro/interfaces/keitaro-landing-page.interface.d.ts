export interface KeitaroLandingPage {
    id: number;
    landing_type?: string;
    action_type?: string;
    action_payload?: string;
    action_options?: Record<string, unknown>;
    name?: string;
    group_id?: number;
    offer_count?: number;
    notes?: string;
    state?: string;
    created_at?: string;
    updated_at?: string;
    archive?: string;
    local_path?: string;
    preview_path?: string;
}
export interface KeitaroLandingsGroup {
    id: number;
    name?: string;
    position?: number;
    type?: string;
}
export type { KeitaroOffer } from "./keitaro-offer.interface";
