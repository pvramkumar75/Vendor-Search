export interface Vendor {
    id: string;
    name: string;
    contact: string;
    address: string;
    website: string;
    category: string;
    rating?: number;
    notes?: string;
    city?: string;
    country?: string;
    verified?: boolean;
}

export interface ItemRequirement {
    id: string;
    itemName: string;
    description: string;
    quantity?: string;
    preferredLocation: string; // "Mumbai", "Hyderabad", "China", etc.
    attachments?: File[];
    additionalSpecs?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    attachments?: string[]; // file names or content snippets
}

export interface ComparisonResult {
    vendors: Vendor[];
    summary: string;
}

export interface Session {
    id: string;
    timestamp: number;
    title: string; // e.g., "Sourcing Valves in Hyderabad"
    requirement: Partial<ItemRequirement>;
    messages: Message[];
    vendors: Vendor[];
}
