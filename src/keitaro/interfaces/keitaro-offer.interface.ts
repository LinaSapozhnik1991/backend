/**
 * Оффер Keitaro Admin API: один объект из списка GET `/admin_api/v1/offers`
 * и тело GET `/admin_api/v1/offers/{id}`.
 * В ответах трекера могут быть дополнительные поля — тип описывает используемые в CRM.
 * @see https://docs.keitaro.io/en/development/admin-api.html
 */
export interface KeitaroOffer {
  id: number;
  name?: string;
  group_id?: number | null;
  /** Человекочитаемое имя группы (часто приходит в списке вместе с group_id) */
  group?: string;
  action_type?: string;
  /** Напр. local | remote — в CRM кладём в landing_type, если нет action_type */
  offer_type?: string;
  action_payload?: string | Record<string, unknown>;
  action_options?: Record<string, unknown>;
  affiliate_network_id?: number | null;
  payout_value?: number;
  payout_currency?: string;
  payout_type?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
  payout_auto?: boolean;
  payout_upsell?: boolean;
  country?: string[];
  notes?: string;
  affiliate_network?: string;
  archive?: string;
  local_path?: string;
  preview_path?: string;
  /** В выдаче Keitaro иногда строка "", иногда массив объектов */
  values?: string | unknown[] | Record<string, unknown>;
  conversion_cap_enabled?: boolean;
  daily_cap?: number;
  conversion_timezone?: string;
  alternative_offer_id?: number;
}
