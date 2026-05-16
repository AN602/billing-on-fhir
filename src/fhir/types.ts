export type Reference = {
  reference?: string;
  display?: string;
  [key: string]: unknown;
};

export type Coding = {
  system?: string;
  code?: string;
  display?: string;
  [key: string]: unknown;
};

export type CodeableConcept = {
  coding?: Coding[];
  text?: string;
  [key: string]: unknown;
};

export type Resource = {
  resourceType: string;
  id?: string;
  [key: string]: unknown;
};

export type BundleEntry = {
  fullUrl?: string;
  resource?: Resource;
  [key: string]: unknown;
};

export type Bundle = Resource & {
  resourceType: "Bundle";
  type?: string;
  total?: number;
  entry: BundleEntry[];
};

export type HumanName = {
  text?: string;
  family?: string;
  given?: string[];
  [key: string]: unknown;
};

export type Identifier = {
  system?: string;
  value?: string;
  [key: string]: unknown;
};

export type Patient = Resource & {
  resourceType: "Patient";
  name?: HumanName[];
  gender?: string;
  birthDate?: string;
  identifier?: Identifier[];
};

export type Encounter = Resource & {
  resourceType: "Encounter";
  status?: string;
  class?: Coding;
  type?: CodeableConcept[];
  subject?: Reference;
  serviceProvider?: Reference;
  period?: { start?: string; end?: string; [key: string]: unknown };
  diagnosis?: Array<{ condition?: Reference; [key: string]: unknown }>;
};

export type Account = Resource & {
  resourceType: "Account";
  status?: string;
  type?: CodeableConcept;
  subject?: Reference[];
  servicePeriod?: { start?: string; end?: string; [key: string]: unknown };
};

export type CompositionSection = {
  title?: string;
  code?: CodeableConcept;
  text?: { status?: string; div?: string; [key: string]: unknown };
  [key: string]: unknown;
};

export type Composition = Resource & {
  resourceType: "Composition";
  status?: string;
  type?: CodeableConcept;
  category?: CodeableConcept[];
  subject?: Reference;
  encounter?: Reference;
  date?: string;
  title?: string;
  author?: Reference[];
  section?: CompositionSection[];
};

export type DiagnosticReport = Resource & {
  resourceType: "DiagnosticReport";
  result?: Reference[];
};

export type Condition = Resource & { resourceType: "Condition" };
export type Practitioner = Resource & { resourceType: "Practitioner"; name?: HumanName[] };
export type Organization = Resource & { resourceType: "Organization"; name?: string };
export type Location = Resource & { resourceType: "Location"; name?: string };
