"use client";

import { useMemo, useState } from "react";
import type * as React from "react";
import type { FormEvent } from "react";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Globe2,
  Handshake,
  LayoutDashboard,
  LogOut,
  Plus,
  Scale,
  Save,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalData } from "@/hooks/use-local-data";
import { netPotential } from "@/lib/calculations";
import { publicSourcingCases, vivaRealPilotOpportunities } from "@/lib/seed";
import {
  activityLabels,
  checklistLabels,
  checklistStatusLabels,
  dictionaries,
  documentTypes,
  statusLabels,
  urgencyLabels,
} from "@/lib/translations";
import type { Activity, ActivityType, ChecklistItem, CurrentStatus, DocumentRecord, Locale, MarketOpportunity, Owner, Property, UrgencyLevel } from "@/lib/types";
import { formatCurrency, formatDate, uid } from "@/lib/utils";

type View = "dashboard" | "properties" | "owners" | "sourcing" | "market" | "contracts";

const statusOptions: CurrentStatus[] = [
  "newLead",
  "analysis",
  "contactStarted",
  "meetingScheduled",
  "mandateSigned",
  "regularization",
  "forSale",
  "closed",
  "lost",
];
const urgencyOptions: UrgencyLevel[] = ["low", "medium", "high", "urgent"];
const activityOptions: ActivityType[] = ["call", "whatsapp", "meeting", "email", "documentRequest", "negotiation"];

const sourcingSources = [
  {
    id: "reurb",
    priority: "P1",
    frequency: { pt: "Semanal", fr: "Hebdomadaire" },
    url: "https://portal-adm.campinas.sp.gov.br/servico/consultar-o-portal-da-regularizacao-fundiaria-urbana-reurb",
    pt: {
      name: "Portal REURB Campinas",
      signal: "Nucleos urbanos informais, fase de regularizacao, modalidade REURB e estimativa de domicilios.",
      action: "Mapear nucleos por bairro, identificar associacoes e oferecer diagnostico tecnico-juridico.",
    },
    fr: {
      name: "Portail REURB Campinas",
      signal: "Noyaux urbains informels, phase de regularisation, modalite REURB et volume estime de logements.",
      action: "Cartographier les quartiers, identifier les associations et proposer un diagnostic technique-juridique.",
    },
  },
  {
    id: "diario",
    priority: "P1",
    frequency: { pt: "2x por semana", fr: "2x par semaine" },
    url: "https://campinas.sp.gov.br/diario-oficial",
    pt: {
      name: "Diario Oficial de Campinas",
      signal: "Publicacoes sobre embargo, auto de infracao, REURB, aprovacao, multas e fiscalizacao.",
      action: "Criar alertas por palavra-chave e registrar cada endereco com risco administrativo.",
    },
    fr: {
      name: "Journal officiel de Campinas",
      signal: "Publications sur embargos, infractions, REURB, approbations, amendes et fiscalisation.",
      action: "Creer des alertes par mot-cle et enregistrer chaque adresse avec risque administratif.",
    },
  },
  {
    id: "urbanismo",
    priority: "P1",
    frequency: { pt: "Semanal", fr: "Hebdomadaire" },
    url: "https://portal-adm.campinas.sp.gov.br/servico/recurso-intimacao-multa-embargo-fiscalizacao-de-obras",
    pt: {
      name: "Fiscalizacao de Obras e Urbanismo",
      signal: "Obra sem alvara, embargo, multa, parcelamento irregular ou loteamento clandestino.",
      action: "Qualificar urgencia, custo de regularizacao e possibilidade de mandato de intermediacao.",
    },
    fr: {
      name: "Fiscalisation des travaux et urbanisme",
      signal: "Construction sans permis, embargo, amende, morcellement irregulier ou lotissement clandestin.",
      action: "Qualifier urgence, cout de regularisation et possibilite de mandat d'intermediation.",
    },
  },
  {
    id: "iptu",
    priority: "P2",
    frequency: { pt: "Sob demanda", fr: "Sur demande" },
    url: "https://portal-adm.campinas.sp.gov.br/servico/certidao-negativa-do-imovel-iptu-e-taxas",
    pt: {
      name: "Certidoes IPTU e taxas",
      signal: "Debito fiscal, certidao positiva, impedimento para venda, inventario ou financiamento.",
      action: "Usar na qualificacao apos obter autorizacao do proprietario ou parceiro originador.",
    },
    fr: {
      name: "Certificats IPTU et taxes",
      signal: "Dette fiscale, certificat positif, blocage de vente, succession ou financement.",
      action: "Utiliser en qualification apres autorisation du proprietaire ou partenaire apporteur.",
    },
  },
  {
    id: "cartorio",
    priority: "P2",
    frequency: { pt: "Sob demanda", fr: "Sur demande" },
    url: "https://ridigital.org.br/",
    pt: {
      name: "RI Digital e cartorios",
      signal: "Matricula desatualizada, onus, penhora, divergencia de area, transcricao antiga ou inventario.",
      action: "Solicitar matricula atualizada quando o lead demonstrar interesse comercial real.",
    },
    fr: {
      name: "RI Digital et registres",
      signal: "Matricule obsolete, charges, saisie, divergence de surface, ancienne transcription ou succession.",
      action: "Demander la matricule actualisee quand le lead montre un interet commercial reel.",
    },
  },
  {
    id: "network",
    priority: "P1",
    frequency: { pt: "Continuo", fr: "Continu" },
    url: "https://www.google.com/search?q=imobiliarias+Campinas+regularizacao+imovel",
    pt: {
      name: "Rede local de originacao",
      signal: "Corretores, advogados de inventario, sindicos, engenheiros, arquitetos e associacoes com casos travados.",
      action: "Criar parceria com fee de indicacao e formulario padrao de triagem.",
    },
    fr: {
      name: "Reseau local d'origination",
      signal: "Agents, avocats succession, syndics, ingenieurs, architectes et associations avec dossiers bloques.",
      action: "Creer un partenariat avec commission d'apport et formulaire standard de tri.",
    },
  },
];

const sourcingKeywords = [
  "REURB",
  "embargo",
  "auto de infracao",
  "loteamento clandestino",
  "parcelamento irregular",
  "obra sem alvara",
  "regularizacao de construcao",
  "IPTU debito",
  "certidao positiva",
  "usucapiao",
  "inventario",
  "averbacao de construcao",
];

function searchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const emptyProperty: Property = {
  id: "",
  address: "",
  city: "Campinas",
  neighborhood: "",
  propertyType: "Residencial",
  estimatedValue: 0,
  iptuDebt: 0,
  regularizationEstimatedCost: 0,
  postRegularizationValue: 0,
  commissionPercentage: 6,
  estimatedCommission: 0,
  registryNumber: "",
  cartorioStatus: "",
  legalStatus: "",
  source: "",
  urgencyLevel: "medium",
  opportunityScore: 0,
  currentStatus: "newLead",
  notes: "",
  createdAt: "",
  updatedAt: "",
};

const emptyOwner: Owner = {
  id: "",
  fullName: "",
  cpfCnpj: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  mainProblem: "",
  objections: "",
  urgencyLevel: "medium",
  lastContactDate: "",
  nextActionDate: "",
  notes: "",
  createdAt: "",
  updatedAt: "",
};

function fieldNumber(form: FormData, key: string) {
  return Number(form.get(key) || 0);
}

export function AppClient() {
  const { data, upsertProperty, deleteProperty, setData, reset } = useLocalData();
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [view, setView] = useState<View>("dashboard");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [iptu, setIptu] = useState("all");
  const [type, setType] = useState("all");
  const [marketCity, setMarketCity] = useState("all");
  const [marketSource, setMarketSource] = useState("all");
  const [marketRisk, setMarketRisk] = useState("all");
  const [marketSignal, setMarketSignal] = useState("all");
  const [minDiscount, setMinDiscount] = useState(15);
  const [selectedId, setSelectedId] = useState(data.properties[0]?.id ?? "");
  const [propertyForm, setPropertyForm] = useState<Property | null>(null);
  const [ownerForm, setOwnerForm] = useState<Owner | null>(null);
  const t = dictionaries[locale];

  const selectedProperty = data.properties.find((item) => item.id === selectedId) ?? data.properties[0];
  const selectedOwner = selectedProperty?.ownerId ? data.owners.find((item) => item.id === selectedProperty.ownerId) : undefined;

  const cities = Array.from(new Set(data.properties.map((item) => item.city))).sort();
  const types = Array.from(new Set(data.properties.map((item) => item.propertyType))).sort();
  const marketCities = Array.from(new Set(data.marketOpportunities.map((item) => item.city))).sort();
  const marketSources = Array.from(new Set(data.marketOpportunities.map((item) => item.sourceName))).sort();
  const marketSignals = Array.from(new Set(data.marketOpportunities.flatMap((item) => item.signals))).sort();
  const filteredMarketOpportunities = data.marketOpportunities.filter((item) => {
    return (
      item.discountPercentage >= minDiscount &&
      (marketCity === "all" || item.city === marketCity) &&
      (marketSource === "all" || item.sourceName === marketSource) &&
      (marketRisk === "all" || item.riskLevel === marketRisk) &&
      (marketSignal === "all" || item.signals.includes(marketSignal))
    );
  });

  const filteredProperties = data.properties.filter((property) => {
    const owner = property.ownerId ? data.owners.find((item) => item.id === property.ownerId) : undefined;
    const haystack = `${property.address} ${property.city} ${property.neighborhood} ${property.propertyType} ${owner?.fullName ?? ""}`.toLowerCase();
    return (
      haystack.includes(query.toLowerCase()) &&
      (city === "all" || property.city === city) &&
      (status === "all" || property.currentStatus === status) &&
      (urgency === "all" || property.urgencyLevel === urgency) &&
      (type === "all" || property.propertyType === type) &&
      (iptu === "all" || (iptu === "with" ? property.iptuDebt > 0 : property.iptuDebt === 0))
    );
  });

  const kpis = useMemo(() => {
    const totalValue = data.properties.reduce((sum, item) => sum + item.estimatedValue, 0);
    const commissions = data.properties.reduce((sum, item) => sum + item.estimatedCommission, 0);
    return [
      { label: t.totalProperties, value: data.properties.length.toString(), icon: Building2 },
      { label: t.iptuDebt, value: data.properties.filter((item) => item.iptuDebt > 0).length.toString(), icon: FileText },
      { label: t.legalAnalysis, value: data.properties.filter((item) => item.currentStatus === "analysis").length.toString(), icon: BarChart3 },
      { label: t.signedMandates, value: data.properties.filter((item) => item.currentStatus === "mandateSigned").length.toString(), icon: Handshake },
      { label: t.regularization, value: data.properties.filter((item) => item.currentStatus === "regularization").length.toString(), icon: ClipboardCheck },
      { label: t.totalValue, value: formatCurrency(totalValue, locale), icon: Building2 },
      { label: t.estimatedCommissions, value: formatCurrency(commissions, locale), icon: BarChart3 },
      { label: t.urgentOpportunities, value: data.properties.filter((item) => item.urgencyLevel === "urgent").length.toString(), icon: FileText },
    ];
  }, [data.properties, locale, t]);

  function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    upsertProperty({
      ...(propertyForm ?? emptyProperty),
      id: propertyForm?.id || uid("prop"),
      ownerId: String(form.get("ownerId") || "") === "unassigned" ? undefined : String(form.get("ownerId") || "") || undefined,
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
      neighborhood: String(form.get("neighborhood") || ""),
      propertyType: String(form.get("propertyType") || ""),
      estimatedValue: fieldNumber(form, "estimatedValue"),
      iptuDebt: fieldNumber(form, "iptuDebt"),
      regularizationEstimatedCost: fieldNumber(form, "regularizationEstimatedCost"),
      postRegularizationValue: fieldNumber(form, "postRegularizationValue"),
      commissionPercentage: fieldNumber(form, "commissionPercentage"),
      registryNumber: String(form.get("registryNumber") || ""),
      cartorioStatus: String(form.get("cartorioStatus") || ""),
      legalStatus: String(form.get("legalStatus") || ""),
      source: String(form.get("source") || ""),
      urgencyLevel: String(form.get("urgencyLevel") || "medium") as UrgencyLevel,
      currentStatus: String(form.get("currentStatus") || "newLead") as CurrentStatus,
      notes: String(form.get("notes") || ""),
    });
    setPropertyForm(null);
  }

  function saveOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    const owner: Owner = {
      ...(ownerForm ?? emptyOwner),
      id: ownerForm?.id || uid("own"),
      fullName: String(form.get("fullName") || ""),
      cpfCnpj: String(form.get("cpfCnpj") || ""),
      phone: String(form.get("phone") || ""),
      whatsapp: String(form.get("whatsapp") || ""),
      email: String(form.get("email") || ""),
      address: String(form.get("address") || ""),
      mainProblem: String(form.get("mainProblem") || ""),
      objections: String(form.get("objections") || ""),
      urgencyLevel: String(form.get("urgencyLevel") || "medium") as UrgencyLevel,
      lastContactDate: String(form.get("lastContactDate") || ""),
      nextActionDate: String(form.get("nextActionDate") || ""),
      notes: String(form.get("notes") || ""),
      createdAt: ownerForm?.createdAt || now,
      updatedAt: now,
    };
    setData((current) => ({
      ...current,
      owners: current.owners.some((item) => item.id === owner.id) ? current.owners.map((item) => (item.id === owner.id ? owner : item)) : [owner, ...current.owners],
    }));
    setOwnerForm(null);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-secondary/35">
      <aside className="fixed inset-y-0 start-0 hidden w-72 border-e bg-background lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold leading-tight">GAB Engenharia</p>
                <p className="text-xs text-muted-foreground">Regularizacao & Oportunidades</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            <NavButton icon={LayoutDashboard} label={t.dashboard} active={view === "dashboard"} onClick={() => setView("dashboard")} />
            <NavButton icon={Building2} label={t.properties} active={view === "properties"} onClick={() => setView("properties")} />
            <NavButton icon={UserRound} label={t.owners} active={view === "owners"} onClick={() => setView("owners")} />
            <NavButton icon={Search} label={t.sourcing} active={view === "sourcing"} onClick={() => setView("sourcing")} />
            <NavButton icon={Scale} label={t.market} active={view === "market"} onClick={() => setView("market")} />
            <NavButton icon={FileText} label={t.contracts} active={view === "contracts"} onClick={() => setView("contracts")} />
          </nav>
          <div className="space-y-3 border-t p-4">
            <p className="text-xs text-muted-foreground">{t.localDataHint}</p>
            <Button variant="outline" className="w-full" onClick={reset}>{t.resetSeed}</Button>
          </div>
        </div>
      </aside>

      <main className="lg:ps-72">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="text-xl font-semibold tracking-normal">{t.appName}</h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setLocale(locale === "pt-BR" ? "fr" : "pt-BR")}>
                <Globe2 className="h-4 w-4" /> {locale === "pt-BR" ? "FR" : "PT-BR"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPropertyForm({ ...emptyProperty })}>
                <Plus className="h-4 w-4" /> {t.newProperty}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" /> {t.logout}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            <MobileNav label={t.dashboard} active={view === "dashboard"} onClick={() => setView("dashboard")} />
            <MobileNav label={t.properties} active={view === "properties"} onClick={() => setView("properties")} />
            <MobileNav label={t.owners} active={view === "owners"} onClick={() => setView("owners")} />
            <MobileNav label={t.sourcing} active={view === "sourcing"} onClick={() => setView("sourcing")} />
            <MobileNav label={t.market} active={view === "market"} onClick={() => setView("market")} />
            <MobileNav label={t.contracts} active={view === "contracts"} onClick={() => setView("contracts")} />
          </div>
        </header>

        <div className="space-y-6 p-4 lg:p-6">
          {view === "dashboard" ? <Dashboard kpis={kpis} properties={data.properties} locale={locale} /> : null}
          {view === "properties" ? (
            <PropertiesView
              t={t}
              locale={locale}
              properties={filteredProperties}
              owners={data.owners}
              selectedProperty={selectedProperty}
              selectedOwner={selectedOwner}
              query={query}
              setQuery={setQuery}
              city={city}
              setCity={setCity}
              cities={cities}
              status={status}
              setStatus={setStatus}
              urgency={urgency}
              setUrgency={setUrgency}
              iptu={iptu}
              setIptu={setIptu}
              type={type}
              setType={setType}
              types={types}
              setSelectedId={setSelectedId}
              setPropertyForm={setPropertyForm}
              deleteProperty={deleteProperty}
              data={data}
              setData={setData}
            />
          ) : null}
          {view === "owners" ? <OwnersView t={t} locale={locale} owners={data.owners} properties={data.properties} setOwnerForm={setOwnerForm} setData={setData} /> : null}
          {view === "sourcing" ? <SourcingView t={t} locale={locale} data={data} setData={setData} setView={setView} setPropertyForm={setPropertyForm} /> : null}
          {view === "market" ? (
            <MarketView
              t={t}
              locale={locale}
              items={filteredMarketOpportunities}
              cities={marketCities}
              sources={marketSources}
              signals={marketSignals}
              city={marketCity}
              setCity={setMarketCity}
              source={marketSource}
              setSource={setMarketSource}
              risk={marketRisk}
              setRisk={setMarketRisk}
              signal={marketSignal}
              setSignal={setMarketSignal}
              minDiscount={minDiscount}
              setMinDiscount={setMinDiscount}
              data={data}
              setData={setData}
            />
          ) : null}
          {view === "contracts" ? <ContractsView t={t} locale={locale} property={selectedProperty} owner={selectedOwner} properties={data.properties} setSelectedId={setSelectedId} /> : null}
        </div>
      </main>

      <Dialog open={!!propertyForm} onOpenChange={(open) => !open && setPropertyForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{propertyForm?.id ? t.edit : t.newProperty}</DialogTitle>
          </DialogHeader>
          {propertyForm ? <PropertyForm t={t} locale={locale} property={propertyForm} owners={data.owners} onSubmit={saveProperty} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!ownerForm} onOpenChange={(open) => !open && setOwnerForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ownerForm?.id ? t.edit : t.newOwner}</DialogTitle>
          </DialogHeader>
          {ownerForm ? <OwnerForm t={t} owner={ownerForm} onSubmit={saveOwner} locale={locale} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MobileNav({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick}>{label}</Button>;
}

function Dashboard({ kpis, properties, locale }: { kpis: { label: string; value: string; icon: typeof Building2 }[]; properties: Property[]; locale: Locale }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{dictionaries[locale].pipeline}</CardTitle>
          <CardDescription>{properties.length} {dictionaries[locale].monitoredOpportunities}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imovel</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Comissao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.slice().sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 6).map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.address}</TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell><Badge variant={property.opportunityScore > 70 ? "urgent" : "secondary"}>{property.opportunityScore}</Badge></TableCell>
                  <TableCell>{formatCurrency(property.estimatedCommission, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function PropertiesView(props: {
  t: Record<string, string>;
  locale: Locale;
  properties: Property[];
  owners: Owner[];
  selectedProperty?: Property;
  selectedOwner?: Owner;
  query: string;
  setQuery: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  cities: string[];
  status: string;
  setStatus: (v: string) => void;
  urgency: string;
  setUrgency: (v: string) => void;
  iptu: string;
  setIptu: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  types: string[];
  setSelectedId: (id: string) => void;
  setPropertyForm: (property: Property) => void;
  deleteProperty: (id: string) => void;
  data: { documents: DocumentRecord[]; checklist: ChecklistItem[]; activities: Activity[]; owners: Owner[]; properties: Property[] };
  setData: React.Dispatch<React.SetStateAction<any>>;
}) {
  const { t, locale } = props;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-5">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="ps-9" placeholder={t.search} value={props.query} onChange={(e) => props.setQuery(e.target.value)} />
              </div>
              <FilterSelect value={props.city} onValueChange={props.setCity} options={["all", ...props.cities]} label={t.city} />
              <FilterSelect value={props.status} onValueChange={props.setStatus} options={["all", ...statusOptions]} label={t.status} labels={statusLabels[locale]} />
              <FilterSelect value={props.urgency} onValueChange={props.setUrgency} options={["all", ...urgencyOptions]} label={t.urgencyLevel} labels={urgencyLabels[locale]} />
              <FilterSelect value={props.type} onValueChange={props.setType} options={["all", ...props.types]} label={t.propertyType} />
            </div>
            <div className="mt-3 max-w-xs">
              <Select value={props.iptu} onValueChange={props.setIptu}>
                <SelectTrigger><SelectValue placeholder={t.iptuDebt} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.iptuDebt}</SelectItem>
                  <SelectItem value="with">IPTU &gt; 0</SelectItem>
                  <SelectItem value="without">IPTU = 0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.address}</TableHead>
                  <TableHead>{t.city}</TableHead>
                  <TableHead>{t.currentStatus}</TableHead>
                  <TableHead>{t.urgencyLevel}</TableHead>
                  <TableHead>{t.estimatedCommission}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.properties.map((property) => (
                  <TableRow key={property.id} onClick={() => props.setSelectedId(property.id)} className="cursor-pointer">
                    <TableCell className="font-medium">{property.address}</TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell><Badge variant="secondary">{statusLabels[locale][property.currentStatus]}</Badge></TableCell>
                    <TableCell><Badge variant={property.urgencyLevel === "urgent" ? "urgent" : "outline"}>{urgencyLabels[locale][property.urgencyLevel]}</Badge></TableCell>
                    <TableCell>{formatCurrency(property.estimatedCommission, locale)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={(event) => { event.stopPropagation(); props.setPropertyForm(property); }}><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={(event) => { event.stopPropagation(); props.deleteProperty(property.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {props.selectedProperty ? <PropertyDetail {...props} property={props.selectedProperty} owner={props.selectedOwner} /> : null}
    </div>
  );
}

function FilterSelect({ value, onValueChange, options, label, labels }: { value: string; onValueChange: (v: string) => void; options: string[]; label: string; labels?: Record<string, string> }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option} value={option}>{option === "all" ? label : labels?.[option] ?? option}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function PropertyDetail({ property, owner, t, locale, data, setData }: any) {
  const propertyDocs = data.documents.filter((item: DocumentRecord) => item.propertyId === property.id);
  const propertyChecklist = data.checklist.filter((item: ChecklistItem) => item.propertyId === property.id);
  const propertyActivities = data.activities.filter((item: Activity) => item.propertyId === property.id);
  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{property.address}</CardTitle>
          <CardDescription>{property.neighborhood}, {property.city}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between"><span>{t.owner}</span><strong>{owner?.fullName ?? "-"}</strong></div>
          <div className="flex justify-between"><span>{t.registryNumber}</span><strong>{property.registryNumber}</strong></div>
          <div className="flex justify-between"><span>{t.opportunityScore}</span><Badge variant="warning">{property.opportunityScore}</Badge></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.financialSummary}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Metric label={t.estimatedValue} value={formatCurrency(property.estimatedValue, locale)} />
          <Metric label={t.estimatedCommission} value={formatCurrency(property.estimatedCommission, locale)} />
          <Metric label={t.netPotential} value={formatCurrency(netPotential(property), locale)} />
          <Metric label={t.gabPriorityScore} value={`${property.opportunityScore}/100`} />
        </CardContent>
      </Card>
      <Tabs defaultValue="docs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="docs">{t.documents}</TabsTrigger>
          <TabsTrigger value="check">{t.checklist}</TabsTrigger>
          <TabsTrigger value="acts">{t.activities}</TabsTrigger>
        </TabsList>
        <TabsContent value="docs"><InlineDocuments t={t} items={propertyDocs} propertyId={property.id} setData={setData} /></TabsContent>
        <TabsContent value="check"><InlineChecklist t={t} locale={locale} items={propertyChecklist} propertyId={property.id} setData={setData} /></TabsContent>
        <TabsContent value="acts"><InlineActivities t={t} locale={locale} items={propertyActivities} propertyId={property.id} ownerId={owner?.id} setData={setData} /></TabsContent>
      </Tabs>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b pb-2 last:border-0"><span className="text-muted-foreground">{label}</span><strong className="text-right">{value}</strong></div>;
}

function InlineDocuments({ t, items, propertyId, setData }: { t: Record<string, string>; items: DocumentRecord[]; propertyId: string; setData: React.Dispatch<React.SetStateAction<any>> }) {
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const doc: DocumentRecord = {
      id: uid("doc"),
      propertyId,
      name: String(form.get("name") || ""),
      type: String(form.get("type") || "Outros"),
      fileUrl: String(form.get("fileUrl") || ""),
      uploadDate: String(form.get("uploadDate") || new Date().toISOString().slice(0, 10)),
      notes: String(form.get("notes") || ""),
    };
    setData((current: any) => ({ ...current, documents: [doc, ...current.documents] }));
    event.currentTarget.reset();
  }
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <form onSubmit={add} className="grid gap-2">
          <Input name="name" placeholder={t.documentName} required />
          <Select name="type" defaultValue="Matricula"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{documentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Input name="fileUrl" placeholder={t.fileUrl} />
          <Input name="uploadDate" type="date" />
          <Button size="sm"><Plus className="h-4 w-4" />{t.add}</Button>
        </form>
        {items.map((item) => <div key={item.id} className="rounded-md border p-3 text-sm"><strong>{item.name}</strong><p className="text-muted-foreground">{item.type} - {item.fileUrl}</p></div>)}
      </CardContent>
    </Card>
  );
}

function InlineChecklist({ t, locale, items, propertyId, setData }: { t: Record<string, string>; locale: Locale; items: ChecklistItem[]; propertyId: string; setData: React.Dispatch<React.SetStateAction<any>> }) {
  function ensureChecklist() {
    const existing = new Set(items.map((item) => item.label));
    const additions = checklistLabels.filter((label) => !existing.has(label)).map((label) => ({ id: uid("chk"), propertyId, label, status: "pending" as const, responsible: "", dueDate: "", notes: "" }));
    setData((current: any) => ({ ...current, checklist: [...current.checklist, ...additions] }));
  }
  function update(id: string, value: string) {
    setData((current: any) => ({ ...current, checklist: current.checklist.map((item: ChecklistItem) => item.id === id ? { ...item, status: value } : item) }));
  }
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <Button variant="outline" size="sm" onClick={ensureChecklist}>{t.add}</Button>
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-md border p-3 text-sm">
            <strong>{item.label}</strong>
            <Select value={item.status} onValueChange={(value) => update(item.id, value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(checklistStatusLabels[locale]).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-muted-foreground">{item.responsible || t.responsible} - {item.dueDate || t.dueDate}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InlineActivities({ t, locale, items, propertyId, ownerId, setData }: { t: Record<string, string>; locale: Locale; items: Activity[]; propertyId: string; ownerId?: string; setData: React.Dispatch<React.SetStateAction<any>> }) {
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const activity: Activity = {
      id: uid("act"),
      propertyId,
      ownerId,
      date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
      type: String(form.get("type") || "call") as ActivityType,
      summary: String(form.get("summary") || ""),
      nextStep: String(form.get("nextStep") || ""),
      responsible: String(form.get("responsible") || ""),
    };
    setData((current: any) => ({ ...current, activities: [activity, ...current.activities] }));
    event.currentTarget.reset();
  }
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <form onSubmit={add} className="grid gap-2">
          <Input name="date" type="date" />
          <Select name="type" defaultValue="call"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activityOptions.map((item) => <SelectItem key={item} value={item}>{activityLabels[locale][item]}</SelectItem>)}</SelectContent></Select>
          <Textarea name="summary" placeholder={t.summary} required />
          <Input name="nextStep" placeholder={t.nextStep} />
          <Input name="responsible" placeholder={t.responsible} />
          <Button size="sm"><Plus className="h-4 w-4" />{t.add}</Button>
        </form>
        {items.map((item) => <div key={item.id} className="rounded-md border p-3 text-sm"><strong>{activityLabels[locale][item.type]} - {formatDate(item.date, locale)}</strong><p className="text-muted-foreground">{item.summary}</p></div>)}
      </CardContent>
    </Card>
  );
}

function OwnersView({ t, locale, owners, properties, setOwnerForm, setData }: { t: Record<string, string>; locale: Locale; owners: Owner[]; properties: Property[]; setOwnerForm: (owner: Owner) => void; setData: React.Dispatch<React.SetStateAction<any>> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>{t.owners}</CardTitle><CardDescription>{owners.length} contatos qualificados</CardDescription></div>
        <Button onClick={() => setOwnerForm({ ...emptyOwner })}><Plus className="h-4 w-4" />{t.newOwner}</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>{t.fullName}</TableHead><TableHead>{t.phone}</TableHead><TableHead>{t.urgencyLevel}</TableHead><TableHead>{t.nextActionDate}</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {owners.map((owner) => (
              <TableRow key={owner.id}>
                <TableCell><strong>{owner.fullName}</strong><p className="text-xs text-muted-foreground">{owner.email}</p></TableCell>
                <TableCell>{owner.whatsapp || owner.phone}</TableCell>
                <TableCell><Badge variant={owner.urgencyLevel === "urgent" ? "urgent" : "outline"}>{urgencyLabels[locale][owner.urgencyLevel]}</Badge></TableCell>
                <TableCell>{formatDate(owner.nextActionDate, locale)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setOwnerForm(owner)}>{t.edit}</Button>
                  <Button variant="ghost" size="icon" onClick={() => setData((current: any) => ({ ...current, owners: current.owners.filter((item: Owner) => item.id !== owner.id), properties: properties.map((property) => property.ownerId === owner.id ? { ...property, ownerId: undefined } : property) }))}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SourcingView({
  t,
  locale,
  data,
  setData,
  setView,
  setPropertyForm,
}: {
  t: Record<string, string>;
  locale: Locale;
  data: { properties: Property[] };
  setData: React.Dispatch<React.SetStateAction<any>>;
  setView: (view: View) => void;
  setPropertyForm: (property: Property) => void;
}) {
  const importableCases = publicSourcingCases.filter((item) => !data.properties.some((property) => property.id === item.id));

  function importCases() {
    setData((current: any) => {
      const existingIds = new Set(current.properties.map((property: Property) => property.id));
      const additions = publicSourcingCases.filter((property) => !existingIds.has(property.id));
      return { ...current, properties: [...additions, ...current.properties] };
    });
    setView("properties");
  }

  const hotSignals =
    locale === "pt-BR"
      ? [
          "Embargo, multa ou obra sem alvara",
          "Proprietario quer vender, mas a documentacao trava o negocio",
          "Debito IPTU relevante ou certidao positiva",
          "Matricula desatualizada, area divergente ou construcao nao averbada",
          "Inventario, usucapiao ou contrato de gaveta",
        ]
      : [
          "Embargo, amende ou construction sans permis",
          "Proprietaire veut vendre, mais les documents bloquent l'affaire",
          "Dette IPTU importante ou certificat positif",
          "Matricule obsolete, surface divergente ou construction non inscrite",
          "Succession, usucapion ou contrat prive non registre",
        ];

  const routine =
    locale === "pt-BR"
      ? [
          "Segunda: revisar Diario Oficial e registrar novos sinais com endereco, bairro e origem.",
          "Terca: cruzar sinais com REURB, zoneamento, valor estimado e potencial de comissao.",
          "Quarta: acionar parceiros locais e pedir indicacoes qualificadas.",
          "Quinta: fazer primeiro contato com oferta de diagnostico e lista de documentos.",
          "Sexta: atualizar status, score, proxima acao e prioridade comercial.",
        ]
      : [
          "Lundi: verifier le Journal officiel et enregistrer les nouveaux signaux avec adresse, quartier et source.",
          "Mardi: croiser les signaux avec REURB, zonage, valeur estimee et commission potentielle.",
          "Mercredi: activer les partenaires locaux et demander des indications qualifiees.",
          "Jeudi: premier contact avec offre de diagnostic et liste de documents.",
          "Vendredi: mettre a jour statut, score, prochaine action et priorite commerciale.",
        ];

  const script =
    locale === "pt-BR"
      ? "Identificamos que este imovel pode ter uma pendencia documental, fiscal ou urbanistica que reduz valor e dificulta venda ou financiamento. A GAB pode fazer um diagnostico objetivo, estimar custo/prazo de regularizacao e, se fizer sentido, conduzir a regularizacao e a intermediacao comercial."
      : "Nous avons identifie que ce bien peut avoir une irregularite documentaire, fiscale ou urbanistique qui reduit sa valeur et complique vente ou financement. GAB peut realiser un diagnostic objectif, estimer cout/delai de regularisation et, si pertinent, conduire la regularisation et l'intermediation commerciale.";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">{t.sourcingTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.sourcingSubtitle}</p>
        </div>
        <Button onClick={() => { setPropertyForm({ ...emptyProperty, source: "Sourcing GAB" }); setView("properties"); }}>
          <Plus className="h-4 w-4" />
          {t.newProperty}
        </Button>
        <Button variant="outline" onClick={importCases} disabled={importableCases.length === 0}>
          <Save className="h-4 w-4" />
          {t.importPublicCases} ({importableCases.length})
        </Button>
      </section>

      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          {importableCases.length} {t.publicCasesReady}. {locale === "pt-BR" ? "Dados sem proprietarios ou CPFs: validar fonte, processo, restricao ambiental e autorizacao antes de contato." : "Donnees sans proprietaires ni CPF: valider source, procedure, restriction environnementale et autorisation avant contact."}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.sourceName}</CardTitle>
            <CardDescription>{locale === "pt-BR" ? "Priorize fontes com problema visivel e proprietario motivado." : "Prioriser les sources avec probleme visible et proprietaire motive."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.sourceName}</TableHead>
                  <TableHead>{t.leadSignal}</TableHead>
                  <TableHead>{t.priority}</TableHead>
                  <TableHead>{t.frequency}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourcingSources.map((source) => {
                  const copy = locale === "pt-BR" ? source.pt : source.fr;
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <strong>{copy.name}</strong>
                        <p className="mt-1 text-xs text-muted-foreground">{copy.action}</p>
                      </TableCell>
                      <TableCell className="max-w-md">{copy.signal}</TableCell>
                      <TableCell><Badge variant={source.priority === "P1" ? "urgent" : "secondary"}>{source.priority}</Badge></TableCell>
                      <TableCell>{locale === "pt-BR" ? source.frequency.pt : source.frequency.fr}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <a href={source.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {t.access}
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.keywordsToMonitor}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {sourcingKeywords.map((keyword) => <Badge key={keyword} variant="outline">{keyword}</Badge>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.qualificationMatrix}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {hotSignals.map((signal, index) => (
                <div key={signal} className="flex gap-3 rounded-md border p-3">
                  <Badge variant={index < 2 ? "urgent" : "secondary"}>{index < 2 ? "+25" : "+15"}</Badge>
                  <span>{signal}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.weeklyRoutine}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routine.map((item) => <p key={item} className="rounded-md border p-3 text-sm">{item}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.outreachScript}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="rounded-md bg-secondary p-4 text-sm leading-6">{script}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MarketView({
  t,
  locale,
  items,
  cities,
  sources,
  signals,
  city,
  setCity,
  source,
  setSource,
  risk,
  setRisk,
  signal,
  setSignal,
  minDiscount,
  setMinDiscount,
  data,
  setData,
}: {
  t: Record<string, string>;
  locale: Locale;
  items: MarketOpportunity[];
  cities: string[];
  sources: string[];
  signals: string[];
  city: string;
  setCity: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  risk: string;
  setRisk: (value: string) => void;
  signal: string;
  setSignal: (value: string) => void;
  minDiscount: number;
  setMinDiscount: (value: number) => void;
  data: { marketOpportunities: MarketOpportunity[] };
  setData: React.Dispatch<React.SetStateAction<any>>;
}) {
  const importableVivaReal = vivaRealPilotOpportunities.filter((item) => !data.marketOpportunities.some((existing) => existing.id === item.id));

  function importVivaRealPilot() {
    setData((current: any) => {
      const existingIds = new Set(current.marketOpportunities.map((item: MarketOpportunity) => item.id));
      const additions = vivaRealPilotOpportunities.filter((item) => !existingIds.has(item.id));
      return { ...current, marketOpportunities: [...additions, ...current.marketOpportunities] };
    });
  }

  const personalDataText =
    locale === "pt-BR"
      ? "Coletar nome, telefone, WhatsApp ou CPF apenas com consentimento do anunciante, parceria formal, atendimento iniciado pelo proprietario ou base legal documentada. Evite dados sensiveis como obito/familia sem necessidade comercial clara."
      : "Collecter nom, telephone, WhatsApp ou CPF uniquement avec consentement de l'annonceur, partenariat formel, demande initiee par le proprietaire ou base legale documentee. Eviter les donnees sensibles comme deces/famille sans necessite commerciale claire.";

  const sourceDirectory = [
    { name: "ZAP Imoveis", url: "https://www.zapimoveis.com.br/venda/imoveis/sp+campinas/" },
    { name: "VivaReal", url: searchUrl("site:vivareal.com.br/venda Campinas imoveis venda VivaReal") },
    { name: "OLX", url: "https://www.olx.com.br/imoveis/venda/estado-sp/campinas-e-regiao" },
    { name: "QuintoAndar", url: "https://www.quintoandar.com.br/comprar/imovel/campinas-sp-brasil" },
    { name: "ImovelWeb", url: "https://www.imovelweb.com.br/imoveis-venda-campinas-sp.html" },
    { name: "Silveira Leiloes", url: "https://www.silveiraleiloes.com.br/" },
    { name: "RBF Leiloes", url: "https://www.rbfleiloes.com.br/" },
    { name: "LEJE", url: "https://www.leje.com.br/" },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold tracking-normal">{t.marketTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.marketSubtitle}</p>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            {importableVivaReal.length} {t.vivaRealPilotReady}. {locale === "pt-BR" ? "Dados publicos de anuncio, sem contatos pessoais." : "Donnees publiques d'annonce, sans contacts personnels."}
          </p>
          <Button variant="outline" onClick={importVivaRealPilot} disabled={importableVivaReal.length === 0}>
            <Save className="h-4 w-4" />
            {t.importVivaRealPilot} ({importableVivaReal.length})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-5">
          <FilterSelect value={city} onValueChange={setCity} options={["all", ...cities]} label={t.city} />
          <FilterSelect value={source} onValueChange={setSource} options={["all", ...sources]} label={t.sourceSite} />
          <FilterSelect value={risk} onValueChange={setRisk} options={["all", "low", "medium", "high"]} label={t.riskLevel} />
          <FilterSelect value={signal} onValueChange={setSignal} options={["all", ...signals]} label={t.signals} />
          <Field label={`${t.minDiscount}: ${minDiscount}%`}>
            <Input type="number" min={0} max={80} value={minDiscount} onChange={(event) => setMinDiscount(Number(event.target.value || 0))} />
          </Field>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{items.length} {t.market}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.properties}</TableHead>
                  <TableHead>{t.sourceSite}</TableHead>
                  <TableHead>{t.minDiscount}</TableHead>
                  <TableHead>{t.riskLevel}</TableHead>
                  <TableHead>{t.signals}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <strong>{item.title}</strong>
                      <p className="text-xs text-muted-foreground">{item.neighborhood}, {item.city}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.motivation}</p>
                    </TableCell>
                    <TableCell>{item.sourceName}</TableCell>
                    <TableCell><Badge variant={item.discountPercentage >= 25 ? "urgent" : "warning"}>{item.discountPercentage}%</Badge></TableCell>
                    <TableCell><Badge variant={item.riskLevel === "high" ? "urgent" : "secondary"}>{item.riskLevel}</Badge></TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.signals.map((entry) => <Badge key={entry} variant="outline">{entry}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={item.sourceName === "VivaReal" ? searchUrl(`${item.title} ${item.neighborhood} VivaReal Campinas`) : item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />{t.access}
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.personalDataPolicy}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{personalDataText}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.sourceSite}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sourceDirectory.map((entry) => (
                <Button key={entry.name} asChild variant="outline" className="w-full justify-between">
                  <a href={entry.url} target="_blank" rel="noreferrer">{entry.name}<ExternalLink className="h-4 w-4" /></a>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ContractsView({ t, locale, property, owner, properties, setSelectedId }: { t: Record<string, string>; locale: Locale; property?: Property; owner?: Owner; properties: Property[]; setSelectedId: (id: string) => void }) {
  const [template, setTemplate] = useState("service");
  const templateLabels: Record<string, string> = {
    service: t.serviceAgreement,
    intermediation: t.intermediationAgreement,
    exclusivity: t.exclusivityClause,
    irrevocable: t.irrevocableCommissionClause,
    authorization: t.regularizationAuthorization,
  };
  const templates: Record<string, Record<Locale, string>> = {
    service: {
      "pt-BR": `CONTRATO DE PRESTACAO DE SERVICOS\n\nContratante: ${owner?.fullName ?? "[proprietario]"}.\nImovel: ${property?.address ?? "[imovel]"}.\nA GAB Engenharia prestara servicos tecnicos de diagnostico, planejamento e acompanhamento da regularizacao imobiliaria, fiscal, registral e administrativa.`,
      fr: `CONTRAT DE PRESTATION DE SERVICES\n\nClient: ${owner?.fullName ?? "[proprietaire]"}.\nBien: ${property?.address ?? "[bien]"}.\nGAB Engenharia fournira des services techniques de diagnostic, planification et suivi de la regularisation immobiliere, fiscale, cadastrale et administrative.`,
    },
    intermediation: {
      "pt-BR": `CONTRATO DE INTERMEDIACAO\n\nO proprietario autoriza a GAB Engenharia a intermediar oportunidades comerciais relativas ao imovel ${property?.address ?? "[imovel]"}, com comissao estimada de ${property ? formatCurrency(property.estimatedCommission, locale) : "[valor]"}.`,
      fr: `CONTRAT D'INTERMEDIATION\n\nLe proprietaire autorise GAB Engenharia a intermedier les opportunites commerciales liees au bien ${property?.address ?? "[bien]"}, avec une commission estimee de ${property ? formatCurrency(property.estimatedCommission, locale) : "[montant]"}.`,
    },
    exclusivity: {
      "pt-BR": "CLAUSULA DE EXCLUSIVIDADE\n\nDurante a vigencia deste instrumento, a GAB Engenharia tera exclusividade para conduzir a regularizacao e a intermediacao comercial do imovel.",
      fr: "CLAUSE D'EXCLUSIVITE\n\nPendant la duree du present instrument, GAB Engenharia aura l'exclusivite pour conduire la regularisation et l'intermediation commerciale du bien.",
    },
    irrevocable: {
      "pt-BR": "CLAUSULA DE COMISSAO IRREVOGAVEL\n\nA comissao da GAB Engenharia sera devida em caso de conclusao do negocio com interessado apresentado, direta ou indiretamente, pela GAB.",
      fr: "CLAUSE DE COMMISSION IRREVOCABLE\n\nLa commission de GAB Engenharia sera due en cas de conclusion de l'affaire avec un interesse presente, directement ou indirectement, par GAB.",
    },
    authorization: {
      "pt-BR": `AUTORIZACAO PARA REGULARIZACAO\n\n${owner?.fullName ?? "[proprietario]"} autoriza a GAB Engenharia a solicitar certidoes, protocolos e informacoes perante prefeitura, cartorio e orgaos competentes.`,
      fr: `AUTORISATION DE REGULARISATION\n\n${owner?.fullName ?? "[proprietaire]"} autorise GAB Engenharia a demander certificats, protocoles et informations aupres de la mairie, du registre et des organismes competents.`,
    },
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader><CardTitle>{t.contracts}</CardTitle><CardDescription>{t.generatePreview}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Label>{t.selectProperty}</Label>
          <Select value={property?.id} onValueChange={setSelectedId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{properties.map((item) => <SelectItem key={item.id} value={item.id}>{item.address}</SelectItem>)}</SelectContent></Select>
          <Label>{t.contractTemplate}</Label>
          <Select value={template} onValueChange={setTemplate}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(templates).map((key) => <SelectItem key={key} value={key}>{templateLabels[key]}</SelectItem>)}</SelectContent></Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t.preview}</CardTitle></CardHeader>
        <CardContent><pre className="min-h-96 whitespace-pre-wrap rounded-md bg-secondary p-5 font-mono text-sm leading-6">{templates[template][locale]}</pre></CardContent>
      </Card>
    </div>
  );
}

function PropertyForm({ t, locale, property, owners, onSubmit }: { t: Record<string, string>; locale: Locale; property: Property; owners: Owner[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label={t.address}><Input name="address" defaultValue={property.address} required /></Field>
      <Field label={t.city}><Input name="city" defaultValue={property.city} required /></Field>
      <Field label={t.neighborhood}><Input name="neighborhood" defaultValue={property.neighborhood} /></Field>
      <Field label={t.propertyType}><Input name="propertyType" defaultValue={property.propertyType} /></Field>
      <Field label={t.owner}><Select name="ownerId" defaultValue={property.ownerId ?? "unassigned"}><SelectTrigger><SelectValue placeholder={t.owner} /></SelectTrigger><SelectContent><SelectItem value="unassigned">-</SelectItem>{owners.map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.fullName}</SelectItem>)}</SelectContent></Select></Field>
      <Field label={t.currentStatus}><Select name="currentStatus" defaultValue={property.currentStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((item) => <SelectItem key={item} value={item}>{statusLabels[locale][item]}</SelectItem>)}</SelectContent></Select></Field>
      <Field label={t.urgencyLevel}><Select name="urgencyLevel" defaultValue={property.urgencyLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{urgencyOptions.map((item) => <SelectItem key={item} value={item}>{urgencyLabels[locale][item]}</SelectItem>)}</SelectContent></Select></Field>
      {["estimatedValue", "iptuDebt", "regularizationEstimatedCost", "postRegularizationValue", "commissionPercentage"].map((key) => <Field key={key} label={t[key]}><Input name={key} type="number" defaultValue={(property as any)[key]} /></Field>)}
      <Field label={t.registryNumber}><Input name="registryNumber" defaultValue={property.registryNumber} /></Field>
      <Field label={t.cartorioStatus}><Input name="cartorioStatus" defaultValue={property.cartorioStatus} /></Field>
      <Field label={t.legalStatus}><Input name="legalStatus" defaultValue={property.legalStatus} /></Field>
      <Field label={t.source}><Input name="source" defaultValue={property.source} /></Field>
      <div className="md:col-span-2"><Field label={t.notes}><Textarea name="notes" defaultValue={property.notes} /></Field></div>
      <div className="md:col-span-2"><Button><Save className="h-4 w-4" />{t.save}</Button></div>
    </form>
  );
}

function OwnerForm({ t, owner, onSubmit, locale }: { t: Record<string, string>; owner: Owner; onSubmit: (event: FormEvent<HTMLFormElement>) => void; locale: Locale }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      {["fullName", "cpfCnpj", "phone", "whatsapp", "email", "address", "mainProblem", "objections"].map((key) => <Field key={key} label={t[key]}><Input name={key} defaultValue={(owner as any)[key]} /></Field>)}
      <Field label={t.urgencyLevel}><Select name="urgencyLevel" defaultValue={owner.urgencyLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{urgencyOptions.map((item) => <SelectItem key={item} value={item}>{urgencyLabels[locale][item]}</SelectItem>)}</SelectContent></Select></Field>
      <Field label={t.lastContactDate}><Input name="lastContactDate" type="date" defaultValue={owner.lastContactDate} /></Field>
      <Field label={t.nextActionDate}><Input name="nextActionDate" type="date" defaultValue={owner.nextActionDate} /></Field>
      <div className="md:col-span-2"><Field label={t.notes}><Textarea name="notes" defaultValue={owner.notes} /></Field></div>
      <div className="md:col-span-2"><Button><Save className="h-4 w-4" />{t.save}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
