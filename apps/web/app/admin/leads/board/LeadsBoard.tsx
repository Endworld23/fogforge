"use client";

import LeadsBoard from "../../../../components/leads/LeadsBoard";

type LeadRowUI = {
  id: string;
  created_at: string;
  provider_id: string | null;
  metro_id: string | null;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  delivery_status: string;
  delivery_error?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  provider: { business_name: string; slug: string } | null;
  metro: { id: string; name: string; slug: string; state: string } | null;
};

type LeadsBoardProps = {
  leads: LeadRowUI[];
  providerOptionsByMetro?: Record<string, { id: string; business_name: string | null }[]>;
};

export default function AdminLeadsBoard({ leads, providerOptionsByMetro }: LeadsBoardProps) {
  return <LeadsBoard leads={leads} mode="admin" providerOptionsByMetro={providerOptionsByMetro} />;
}
