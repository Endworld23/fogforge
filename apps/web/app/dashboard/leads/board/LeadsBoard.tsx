"use client";

import LeadsBoard from "../../../../components/leads/LeadsBoard";

type LeadRowUI = {
  id: string;
  created_at: string;
  viewed_at: string | null;
  last_contacted_at: string | null;
  resolved_at: string | null;
  resolution_status: string | null;
  escalated_at: string | null;
  delivery_status: string;
  delivery_error?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  metro: { name: string; state: string } | null;
};

type LeadsBoardProps = {
  leads: LeadRowUI[];
};

export default function ProviderLeadsBoard({ leads }: LeadsBoardProps) {
  return <LeadsBoard leads={leads} mode="provider" />;
}
