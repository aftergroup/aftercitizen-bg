#!/usr/bin/env node

/**
 * Fixed Baserow API Client and Schema Fetcher
 * 
 * This script uses the correct Baserow API endpoints to fetch database schema.
 * 
 * Usage: node baserow-fetcher-fixed.mjs
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('📄 Loading .env file...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const TOKEN = process.env.VITE_BASEROW_API_TOKEN;
const DATABASE_ID = process.env.VITE_BASEROW_DATABASE_ID;
const BASE_URL = 'https://db2.aftergroup.org';

// Get table IDs from environment
const TABLE_IDS = {
  // Settings table
  projects: process.env.VITE_BASEROW_PROJECTS_TABLE_ID,
  projectGroups: process.env.VITE_BASEROW_PROJECT_GROUPS_TABLE_ID,
  workflowTemplates: process.env.VITE_BASEROW_WORKFLOW_TEMPLATES_TABLE_ID,
  users: process.env.VITE_BASEROW_USERS_TABLE_ID,
  userRoles: process.env.VITE_BASEROW_USER_ROLES_TABLE_ID,
  countries: process.env.VITE_BASEROW_COUNTRIES_TABLE_ID,
  currencies: process.env.VITE_BASEROW_CURRENCIES_TABLE_ID,
  companies: process.env.VITE_BASEROW_COMPANIES_TABLE_ID,
  contacts: process.env.VITE_BASEROW_CONTACTS_TABLE_ID,
  operationalEvents: process.env.VITE_BASEROW_OPERATIONAL_EVENTS_TABLE_ID,
  crmLeads: process.env.VITE_BASEROW_CRM_LEADS_TABLE_ID,
  crmDeals: process.env.VITE_BASEROW_CRM_DEALS_TABLE_ID,
  invoicesOutgoing: process.env.VITE_BASEROW_INVOICES_OUTGOING_TABLE_ID,
  invoicesIncoming: process.env.VITE_BASEROW_INVOICES_INCOMING_TABLE_ID,
  organizations: process.env.VITE_BASEROW_ORGANIZATIONS_TABLE_ID,
  subscriptionsIncoming: process.env.VITE_BASEROW_SUBSCRIPTIONS_INCOMING_TABLE_ID,
  subscriptionsOutgoing: process.env.VITE_BASEROW_SUBSCRIPTIONS_OUTGOING_TABLE_ID,
  places: process.env.VITE_BASEROW_PLACES_TABLE_ID,
  tagGroups: process.env.VITE_BASEROW_TAG_GROUPS_TABLE_ID,
  tags: process.env.VITE_BASEROW_TAGS_TABLE_ID,
  artists: process.env.VITE_BASEROW_ARTISTS_TABLE_ID,
  events: process.env.VITE_BASEROW_EVENTS_TABLE_ID,
  paymentProviders: process.env.VITE_BASEROW_PAYMENT_PROVIDERS_TABLE_ID,
  settings: process.env.VITE_BASEROW_SETTINGS_TABLE_ID,
};

console.log('🚀 Fixed Baserow Schema Fetcher');
console.log(`Database ID: ${DATABASE_ID}`);
console.log(`Token: ${TOKEN ? TOKEN.substring(0, 8) + '...' : 'NOT SET'}`);

if (!TOKEN || !DATABASE_ID) {
  console.error('❌ Missing TOKEN or DATABASE_ID');
  process.exit(1);
}

// Make request with proper error handling
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${url}`;
    console.log(`🔍 Fetching: ${url}`);
    
    const options = {
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.get(fullUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            console.log('   Raw response:', data.substring(0, 200));
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        } else {
          console.log('   Error response:', data.substring(0, 300));
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function fetchSchema() {
  const schema = {
    database_id: parseInt(DATABASE_ID),
    tables: {},
    generated_at: new Date().toISOString(),
    fetcher_version: 'fixed-v1.0'
  };

  console.log('\n📋 Table IDs from .env:');
  Object.entries(TABLE_IDS).forEach(([name, id]) => {
    if (id) console.log(`  ${name}: ${id}`);
  });

  // Try different API endpoints to find the working one
  const endpoints = [
    `/api/database/tables/database/${DATABASE_ID}/`,
    `/api/applications/${DATABASE_ID}/`,
    `/api/database/${DATABASE_ID}/tables/`,
    `/api/workspaces/`,
  ];

  let tablesFound = false;

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Trying endpoint: ${endpoint}`);
      const response = await makeRequest(endpoint);
      
      if (response.results && Array.isArray(response.results)) {
        console.log(`✅ Found data with ${response.results.length} items`);
        console.log('Sample item:', JSON.stringify(response.results[0], null, 2).substring(0, 200));
      } else if (response.tables && Array.isArray(response.tables)) {
        console.log(`✅ Found ${response.tables.length} tables`);
        tablesFound = true;
        
        for (const table of response.tables) {
          console.log(`\n📊 Processing table: ${table.name} (ID: ${table.id})`);
          
          try {
            const fields = await makeRequest(`/api/database/fields/table/${table.id}/`);
            
            schema.tables[table.name] = {
              id: table.id,
              name: table.name,
              order: table.order,
              fields: fields.map(field => ({
                id: field.id,
                name: field.name,
                type: field.type,
                primary: field.primary || false,
                required: field.required || false,
                ...field
              }))
            };
            
            console.log(`  ✅ ${fields.length} fields retrieved`);
            
          } catch (error) {
            console.error(`  ❌ Failed to fetch fields for ${table.name}:`, error.message);
          }
        }
        break;
      } else {
        console.log('Response structure:', Object.keys(response));
        if (response.name) console.log('Name:', response.name);
        if (response.id) console.log('ID:', response.id);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Also use known table IDs from .env (ensures extra tables like Orders are included)
  console.log('\n🔍 Using known table IDs from .env...');

  const tableNames = {
    projects: { id: TABLE_IDS.projects, name: 'Projects' },
    projectGroups: { id: TABLE_IDS.projectGroups, name: 'Project Groups' },
    workflowTemplates: { id: TABLE_IDS.workflowTemplates, name: 'Workflow Templates' },
    users: { id: TABLE_IDS.users, name: 'Users' },
    userRoles: { id: TABLE_IDS.userRoles, name: 'User Roles' },
    countries: { id: TABLE_IDS.countries, name: 'Countries' },
    currencies: { id: TABLE_IDS.currencies, name: 'Currencies' },
    companies: { id: TABLE_IDS.companies, name: 'Companies' },
    contacts: { id: TABLE_IDS.contacts, name: 'Contacts' },
    operationalEvents: { id: TABLE_IDS.operationalEvents, name: 'Operational Events' },
    crmLeads: { id: TABLE_IDS.crmLeads, name: 'CRM Leads' },
    crmDeals: { id: TABLE_IDS.crmDeals, name: 'CRM Deals' },
    invoicesOutgoing: { id: TABLE_IDS.invoicesOutgoing, name: 'Invoices Outgoing' },
    invoicesIncoming: { id: TABLE_IDS.invoicesIncoming, name: 'Invoices Incoming' },
    organizations: { id: TABLE_IDS.organizations, name: 'Organizations' },
    subscriptionsIncoming: { id: TABLE_IDS.subscriptionsIncoming, name: 'Subscriptions Incoming' },
    subscriptionsOutgoing: { id: TABLE_IDS.subscriptionsOutgoing, name: 'Subscriptions Outgoing' },
    places: { id: TABLE_IDS.places, name: 'Places' },
    tagGroups: { id: TABLE_IDS.tagGroups, name: 'Tag Groups' },
    tags: { id: TABLE_IDS.tags, name: 'Tags' },
    artists: { id: TABLE_IDS.artists, name: 'Artists' },
    events: { id: TABLE_IDS.events, name: 'Events' },
    paymentProviders: { id: TABLE_IDS.paymentProviders, name: 'Payment Providers' },
    settings: { id: TABLE_IDS.settings, name: 'Settings' },
  };

  const missingTables = Object.values(tableNames)
    .filter(t => !t.id || t.id === 'undefined')
    .map(t => t.name);

  if (missingTables.length) {
    console.error(`\n❌ Missing table IDs for: ${missingTables.join(', ')}`);
    console.error('   Please set VITE_BASEROW_PROJECTS_TABLE_ID, VITE_BASEROW_PROJECT_GROUPS_TABLE_ID, VITE_BASEROW_WORKFLOW_TEMPLATES_TABLE_ID, VITE_BASEROW_USERS_TABLE_ID, VITE_BASEROW_USER_ROLES_TABLE_ID');
    process.exit(1);
  }

  for (const table of Object.values(tableNames)) {
    console.log(`\n📊 Processing ${table.name} (ID: ${table.id})`);

    try {
      const fields = await makeRequest(`/api/database/fields/table/${table.id}/`);

      schema.tables[table.name] = {
        id: parseInt(table.id),
        name: table.name,
        fields: fields.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type,
          primary: field.primary || false,
          required: field.required || false,
          ...field
        }))
      };

      console.log(`  ✅ ${fields.length} fields retrieved`);

      // Show first few fields
      fields.slice(0, 3).forEach(field => {
        console.log(`    - ${field.name} (${field.type})`);
      });

    } catch (error) {
      console.error(`  ❌ Failed to fetch fields for ${table.name}:`, error.message);
    }
  }

  // Save schema in repo root (next to this script)
  const schemaPath = path.join(__dirname, 'baserow-schema.json');
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`\n💾 Schema saved to: ${schemaPath}`);

  // Generate TypeScript definitions
  generateTypeScriptDefinitions(schema);
}

function generateTypeScriptDefinitions(schema) {
  let tsContent = `// Auto-generated TypeScript definitions for Baserow database
// Generated at: ${schema.generated_at}
// Database ID: ${schema.database_id}

`;

  Object.entries(schema.tables).forEach(([tableName, table]) => {
    const interfaceName = tableName.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
    
    tsContent += `export interface ${interfaceName} {\n`;
    
    table.fields.forEach(field => {
      const fieldName = field.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      let fieldType = 'any';
      
      switch (field.type) {
        case 'text':
        case 'long_text':
        case 'url':
        case 'email':
        case 'phone_number':
          fieldType = 'string';
          break;
        case 'number':
        case 'rating':
          fieldType = 'number';
          break;
        case 'boolean':
          fieldType = 'boolean';
          break;
        case 'date':
        case 'last_modified':
        case 'created_on':
          fieldType = 'string'; // ISO date string
          break;
        case 'single_select':
          if (field.select_options && field.select_options.length > 0) {
            fieldType = field.select_options.map(opt => `'${opt.value}'`).join(' | ');
          } else {
            fieldType = 'string';
          }
          break;
        case 'multiple_select':
          fieldType = 'string[]';
          break;
        case 'file':
          fieldType = 'any[]';
          break;
        case 'link_row':
          fieldType = 'number[]';
          break;
        default:
          fieldType = 'any';
      }
      
      const optional = field.required ? '' : '?';
      tsContent += `  ${fieldName}${optional}: ${fieldType};\n`;
    });
    
    tsContent += `}\n\n`;
  });

  const tsPath = path.join(__dirname, 'baserow-types.d.ts');
  fs.writeFileSync(tsPath, tsContent);
  console.log(`📝 TypeScript definitions saved to: ${tsPath}`);
}

fetchSchema().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
