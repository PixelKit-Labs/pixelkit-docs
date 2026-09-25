/**
 * @file build-openapi.mjs
 * @description Automatically builds and synchronizes public/openapi.json and public/openapi.yaml
 * directly from data/hooks/*.json whenever pixelkit-docs is built or synced.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HOOKS_DIR = path.join(ROOT, 'data', 'hooks');
const PUBLIC_DIR = path.join(ROOT, 'public');

const CATEGORY_META = {
  'silicon-compute': {
    name: 'Silicon & Compute',
    description: 'Tensor G6 CPU cores, PowerVR GPU, system memory, battery fuel gauge, and ADPF thermals.',
  },
  'neural-ai': {
    name: 'Neural & AI',
    description: 'Gemini Nano on-device AICore, ML Kit vision and NLP, speech recognition/synthesis, and EdgeTPU embeddings.',
  },
  'sensors-actuators': {
    name: 'Sensors & Actuators',
    description: 'IMU, barometer altimetry, camera extensions, LRA haptics, mic array directivity, FIR thermometer, and torch.',
  },
  'radios-security': {
    name: 'Radios & Security',
    description: 'Titan M2 Keystore, biometrics, BLE 6.0 Channel Sounding, NFC, GNSS, Wi-Fi 7 MLO, Wi-Fi RTT, Satellite NTN, and Private Space.',
  },
  'system-media': {
    name: 'System & Media',
    description: 'Microphone capture, cellular modem, display telemetry, media library, spatial audio, and video playback.',
  },
  'pro-exclusives': {
    name: 'Pixel Pro Exclusives',
    description: 'Hardware exclusive to Google Pixel Pro models: HiLight 8-LED ring and Ultra-Wideband (UWB) spatial ranging.',
  },
};

const SECTION_OF = {
  silicon: 'silicon-compute',
  compute: 'silicon-compute',
  ai: 'neural-ai',
  sensors: 'sensors-actuators',
  radios: 'radios-security',
  security: 'radios-security',
  system: 'system-media',
  pro: 'pro-exclusives',
  'silicon-compute': 'silicon-compute',
  'neural-ai': 'neural-ai',
  'sensors-actuators': 'sensors-actuators',
  'radios-security': 'radios-security',
  'system-media': 'system-media',
  'pro-exclusives': 'pro-exclusives',
};

function typeToSchema(typeStr) {
  if (!typeStr) return { type: 'string' };
  typeStr = typeStr.trim();

  if (typeStr.startsWith('(') && typeStr.includes('=>')) return null;

  const parts = typeStr.split('|').map((s) => s.trim());
  const isNullable = parts.includes('null');
  const withoutNull = parts.filter((s) => s !== 'null' && s !== 'undefined').join(' | ');

  if (!withoutNull) return { type: 'null' };

  if (withoutNull.startsWith('{') && withoutNull.endsWith('}')) {
    return isNullable
      ? { anyOf: [{ type: 'object', description: withoutNull }, { type: 'null' }] }
      : { type: 'object', description: withoutNull };
  }

  if (withoutNull.startsWith("'") && withoutNull.endsWith("'") && !withoutNull.includes('{')) {
    const enumValues = withoutNull.split('|').map((s) => s.trim().replace(/^'|'$/g, ''));
    return isNullable
      ? { anyOf: [{ type: 'string', enum: enumValues }, { type: 'null' }] }
      : { type: 'string', enum: enumValues };
  }

  if (withoutNull.endsWith('[]')) {
    const itemType = withoutNull.slice(0, -2).trim();
    const itemSchema = typeToSchema(itemType);
    return isNullable
      ? { anyOf: [{ type: 'array', items: itemSchema || {} }, { type: 'null' }] }
      : { type: 'array', items: itemSchema || {} };
  }

  if (withoutNull.startsWith('Array<') && withoutNull.endsWith('>')) {
    const itemType = withoutNull.slice(6, -1).trim();
    const itemSchema = typeToSchema(itemType);
    return isNullable
      ? { anyOf: [{ type: 'array', items: itemSchema || {} }, { type: 'null' }] }
      : { type: 'array', items: itemSchema || {} };
  }

  if (withoutNull === 'string') return isNullable ? { anyOf: [{ type: 'string' }, { type: 'null' }] } : { type: 'string' };
  if (withoutNull === 'number') return isNullable ? { anyOf: [{ type: 'number' }, { type: 'null' }] } : { type: 'number' };
  if (withoutNull === 'boolean') return isNullable ? { anyOf: [{ type: 'boolean' }, { type: 'null' }] } : { type: 'boolean' };
  if (withoutNull === 'any' || withoutNull === 'unknown') return {};

  if (withoutNull === 'TelemetrySource') {
    return { $ref: '#/components/schemas/TelemetrySource' };
  }

  if (withoutNull.startsWith('Record<')) {
    return isNullable
      ? { anyOf: [{ type: 'object', additionalProperties: true }, { type: 'null' }] }
      : { type: 'object', additionalProperties: true };
  }

  const cleanName = withoutNull.replace(/[^a-zA-Z0-9_]/g, '');
  if (cleanName.length > 0) {
    return isNullable
      ? { anyOf: [{ $ref: `#/components/schemas/${cleanName}` }, { type: 'null' }] }
      : { $ref: `#/components/schemas/${cleanName}` };
  }

  return isNullable ? { anyOf: [{ type: 'object' }, { type: 'null' }] } : { type: 'object' };
}

function extractActionNames(raw) {
  const parts = raw.split('/').map((s) => s.trim());
  return parts
    .map((part) => part.replace(/\(.*$/, '').trim())
    .filter((n) => n.length > 0 && !n.includes(' '));
}

function toYaml(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  if (obj === undefined) return '';
  if (obj === null) return 'null\n';
  if (typeof obj === 'boolean') return `${obj}\n`;
  if (typeof obj === 'number') return `${obj}\n`;
  if (typeof obj === 'string') {
    if (obj.includes('\n')) {
      const lines = obj.trim().split('\n');
      return `|\n${lines.map((l) => `${pad}  ${l}`).join('\n')}\n`;
    }
    if (/[:#\[\]{},&*!|>'"%@`\\]/.test(obj) || obj === '' || !isNaN(Number(obj))) {
      return JSON.stringify(obj) + '\n';
    }
    return `${obj}\n`;
  }
  if (Array.isArray(obj)) {
    const nonUndefined = obj.filter((item) => item !== undefined);
    if (nonUndefined.length === 0) return '[]\n';
    let out = '\n';
    for (const item of nonUndefined) {
      if (typeof item === 'object' && item !== null) {
        const itemYaml = toYaml(item, indent + 2).trimStart();
        out += `${pad}- ${itemYaml}`;
      } else {
        out += `${pad}- ${toYaml(item, 0)}`;
      }
    }
    return out;
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj).filter(([_, v]) => v !== undefined);
    if (entries.length === 0) return '{}\n';
    let out = '\n';
    for (const [k, v] of entries) {
      if (typeof v === 'object' && v !== null) {
        out += `${pad}${k}:${toYaml(v, indent + 2)}`;
      } else {
        out += `${pad}${k}: ${toYaml(v, 0)}`;
      }
    }
    return out;
  }
  return `${obj}\n`;
}

/**
 * The SDK version the spec's `info.version` reports.
 *
 * This used to read `../Pixel delta/package.json` — the maintainer's local folder name — and fall
 * back to a hard-coded '1.6.8' inside an empty catch. On any other machine, and in CI, that path does
 * not exist, so every deployed build silently published a spec labelled 1.6.8 whatever the SDK was.
 *
 * Now there are two sources and no fallback:
 *   - `PIXELKIT_SDK_DIR`, a local pixelkit-sdk checkout, for offline work or an unpushed version bump.
 *     If it is set and does not hold a package.json, that is an error, not a reason to look elsewhere.
 *   - Otherwise the SDK's package.json on GitHub, so CI and every workstation agree.
 * Anything else — a failed fetch, a response that is not a version — stops the build, because a spec
 * stamped with the wrong version is worse than no new spec.
 */
async function resolveSdkVersion() {
  const isVersion = (v) => typeof v === 'string' && /^[0-9]+[.][0-9]+[.][0-9]+$/.test(v);
  const local = process.env.PIXELKIT_SDK_DIR;
  if (local) {
    const pkgPath = path.resolve(local, 'package.json');
    if (!existsSync(pkgPath)) {
      throw new Error(`[build-openapi] PIXELKIT_SDK_DIR is set to ${local}, but ${pkgPath} does not exist.`);
    }
    const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
    if (!isVersion(version)) throw new Error(`[build-openapi] ${pkgPath} has no usable version: ${version}`);
    return version;
  }
  const url = process.env.PIXELKIT_SDK_PACKAGE_URL
    ?? 'https://raw.githubusercontent.com/PixelKit-Labs/pixelkit-sdk/master/package.json';
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(`[build-openapi] Could not reach ${url} to read the SDK version (${e.message}). Offline, set PIXELKIT_SDK_DIR to a pixelkit-sdk checkout.`);
  }
  if (!response.ok) throw new Error(`[build-openapi] ${url} answered ${response.status}; cannot read the SDK version.`);
  const version = (await response.json()).version;
  if (!isVersion(version)) throw new Error(`[build-openapi] ${url} returned no usable version: ${version}`);
  return version;
}

export function generateOpenApi(sdkVersion) {
  if (!existsSync(HOOKS_DIR)) {
    console.warn(`[build-openapi] No data/hooks directory found at ${HOOKS_DIR}`);
    return;
  }

  const files = readdirSync(HOOKS_DIR).filter((f) => f.endsWith('.json')).sort();
  const hooks = files.map((f) => JSON.parse(readFileSync(path.join(HOOKS_DIR, f), 'utf8')));

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'PixelKit SDK API',
      version: sdkVersion,
      description: `
OpenAPI 3.1.0 specification for the **PixelKit SDK** targeting Google Pixel hardware (Tensor G6, Titan M2/M3, Android 17 API 37).

### The Zero-Simulation Principle
Every telemetry read exposes \`source: 'hardware' | 'derived' | 'unavailable'\`.
- Fabricated readings are completely unrepresentable in this specification.
- Unreadable sensor readings are \`null\` and report \`unavailable\`.
- Actuators reject with an explicit reason in \`error\` when hardware is unavailable or disabled.

Covers all ${files.length} typed hardware and AI hooks, low-overhead native telemetry, and actuators.
      `.trim(),
      contact: {
        name: 'PixelKit Labs',
        url: 'https://github.com/PixelKit-Labs/pixelkit-sdk',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8081/api',
        description: 'PixelKit DevTools / Local Metro Bridge',
      },
      {
        url: 'http://127.0.0.1:2345/api',
        description: 'PixelKit Native Hardware Daemon (ADB Port-Forwarded)',
      },
    ],
    tags: Object.entries(CATEGORY_META).map(([id, meta]) => ({
      name: id,
      description: meta.description,
    })),
    paths: {
      '/state': {
        get: {
          summary: 'Get Full Device Hardware Telemetry Snapshot',
          description:
            'Atomic snapshot of available instantaneous hardware telemetry. Values are strictly measured from real hardware or null.',
          operationId: 'getFullDeviceState',
          tags: ['silicon-compute'],
          responses: {
            '200': {
              description: 'Complete device hardware telemetry state snapshot.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HardwareStateSnapshot',
                  },
                },
              },
            },
          },
        },
      },
      '/hooks': {
        get: {
          summary: 'List All PixelKit Hardware & AI Hooks',
          description: `Lists all ${files.length} available hooks, their categories, descriptions, and hardware chip badges.`,
          operationId: 'listHooks',
          tags: ['silicon-compute'],
          responses: {
            '200': {
              description: `List of all ${files.length} hooks.`,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/HookCatalogItem',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        TelemetrySource: {
          type: 'string',
          enum: ['hardware', 'derived', 'unavailable'],
          description:
            "Data provenance indicator. PixelKit strictly adheres to the Zero-Simulation Principle: values are real hardware measurements ('hardware'), computed directly from hardware ('derived'), or unavailable ('unavailable'). Unreadable values return null.",
        },
        HookCatalogItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'useThermometer' },
            name: { type: 'string', example: 'useThermometer' },
            category: { type: 'string', example: 'sensors-actuators' },
            chipBadge: { type: 'string', example: 'FIR · MLX90632 · thermal' },
            summary: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['id', 'name', 'category', 'summary'],
        },
        Vector3D: {
          type: 'object',
          description: '3-dimensional Cartesian vector for spatial orientation.',
          properties: {
            x: { type: 'number', description: 'Lateral tilt or movement' },
            y: { type: 'number', description: 'Longitudinal tilt or movement' },
            z: { type: 'number', description: 'Vertical gravitational force or spin' },
          },
          required: ['x', 'y', 'z'],
        },
        BarometerData: {
          type: 'object',
          description: 'Atmospheric pressure and barometric altitude.',
          properties: {
            pressure: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'Pressure in hPa' },
            relativeAltitude: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'Altitude in meters' },
          },
        },
        MloLinkInfo: {
          type: 'object',
          description: 'Affiliated Wi-Fi 7 Multi-Link Operation (MLO) link.',
          properties: {
            band: { type: 'string', enum: ['2.4GHz', '5GHz', '6GHz'] },
            channelWidthMHz: { type: 'number' },
            rssi: { type: 'number' },
            txLinkSpeedMbps: { type: 'number' },
            rxLinkSpeedMbps: { type: 'number' },
            state: { type: 'string' },
          },
        },
        WifiRttResult: {
          type: 'object',
          description: 'Wi-Fi RTT 802.11mc/802.11az ranging measurement.',
          properties: {
            bssid: { type: 'string' },
            distanceMm: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            distanceStdDevMm: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            rssi: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            status: { type: 'string' },
          },
        },
        BlePeripheral: {
          type: 'object',
          description: 'Discovered Bluetooth Low Energy peripheral.',
          properties: {
            id: { type: 'string' },
            name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            rssi: { type: 'number' },
            txPower: { anyOf: [{ type: 'number' }, { type: 'null' }] },
            isConnectable: { type: 'boolean' },
          },
        },
        MicrophoneInfo: {
          type: 'object',
          description: 'Microphone hardware characteristics from acoustic array.',
          properties: {
            id: { type: 'number' },
            type: { type: 'string' },
            location: { type: 'string' },
            directionality: { type: 'string' },
            address: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
        CapturedPhoto: {
          type: 'object',
          description: 'Captured high-resolution photo.',
          properties: {
            uri: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
            base64: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
        SavedMedia: {
          type: 'object',
          description: 'Media item saved in the gallery.',
          properties: {
            id: { type: 'string' },
            filename: { type: 'string' },
            uri: { type: 'string' },
            mediaType: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
            duration: { type: 'number' },
          },
        },
        KeyAgreementKeyPairResult: {
          type: 'object',
          description: 'ECDH key pair generated in Titan M2 hardware.',
          properties: {
            alias: { type: 'string' },
            publicKeyBase64: { type: 'string' },
            algorithm: { type: 'string' },
            isStrongBoxBacked: { type: 'boolean' },
          },
        },
        SharedSecretResult: {
          type: 'object',
          description: 'Derived ECDH shared secret.',
          properties: {
            sharedSecretBase64: { type: 'string' },
            keyLengthBits: { type: 'number' },
          },
        },
        SatelliteGuidance: {
          type: 'object',
          description: 'Antenna pointing guidance for non-terrestrial satellite alignment.',
          properties: {
            azimuthDeg: { type: 'number' },
            elevationDeg: { type: 'number' },
            isAligned: { type: 'boolean' },
          },
        },
      },
    },
  };

  const snapshotProperties = {};

  for (const hook of hooks) {
    const hookName = hook.name;
    const category = SECTION_OF[hook.category] || 'silicon-compute';
    const schemaName = `${hookName}Telemetry`;

    const properties = {};
    const required = [];

    for (const ret of hook.returns || []) {
      const fieldSchema = typeToSchema(ret.type);
      if (fieldSchema) {
        fieldSchema.description = ret.desc;
        properties[ret.name] = fieldSchema;
      }
    }

    if (properties.source) required.push('source');

    spec.components.schemas[schemaName] = {
      type: 'object',
      description: `${hook.summary}\n\n${hook.description}`,
      properties,
      required: required.length > 0 ? required : undefined,
    };

    snapshotProperties[hookName] = {
      $ref: `#/components/schemas/${schemaName}`,
    };

    const hookPath = `/hooks/${hookName}`;
    const parameters = [];

    for (const param of hook.params || []) {
      parameters.push({
        name: param.name,
        in: 'query',
        description: param.desc,
        required: false,
        schema: typeToSchema(param.type) || { type: 'string' },
      });
    }

    spec.paths[hookPath] = {
      get: {
        summary: hook.summary,
        description: `${hook.plain || hook.summary}\n\n${hook.description}`,
        operationId: `get_${hookName}`,
        tags: [category],
        parameters: parameters.length > 0 ? parameters : undefined,
        responses: {
          '200': {
            description: `Current telemetry reading from ${hookName}.`,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${schemaName}`,
                },
              },
            },
          },
        },
      },
    };

    for (const action of hook.actions || []) {
      const actionNames = extractActionNames(action.name);
      for (const actionName of actionNames) {
        const actionPath = `/hooks/${hookName}/actions/${actionName}`;
        const reqSchemaName = `${hookName}_${actionName}_Request`;
        const resSchemaName = `${hookName}_${actionName}_Response`;

        const reqProperties = {};
        const reqRequired = [];

        for (const inp of action.inputs || []) {
          const inpSchema = typeToSchema(inp.type) || { type: 'string' };
          inpSchema.description = inp.desc;
          reqProperties[inp.name] = inpSchema;
          if (!inp.type.includes('?') && !inp.type.includes('undefined')) {
            reqRequired.push(inp.name);
          }
        }

        spec.components.schemas[reqSchemaName] = {
          type: 'object',
          description: `Request payload for ${actionName} on ${hookName}.`,
          properties: reqProperties,
          required: reqRequired.length > 0 ? reqRequired : undefined,
        };

        spec.components.schemas[resSchemaName] = {
          type: 'object',
          description: `Response payload for ${actionName} on ${hookName}.`,
          properties: {
            success: { type: 'boolean', description: 'Whether the hardware accepted the command.' },
            output: { description: action.output || 'Result description' },
            error: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Error message if failed.' },
            source: { $ref: '#/components/schemas/TelemetrySource' },
          },
          required: ['success', 'source'],
        };

        const outputDesc = action.output ? `\n\n**Output Contract**: ${action.output}` : '';

        spec.paths[actionPath] = {
          post: {
            summary: `Invoke ${actionName} (${hookName})`,
            description: `${action.desc}${outputDesc}`,
            operationId: `${hookName}_${actionName}`,
            tags: [category],
            requestBody:
              Object.keys(reqProperties).length > 0
                ? {
                    required: reqRequired.length > 0,
                    content: {
                      'application/json': {
                        schema: {
                          $ref: `#/components/schemas/${reqSchemaName}`,
                        },
                      },
                    },
                  }
                : undefined,
            responses: {
              '200': {
                description: `Result of invoking ${actionName}.`,
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${resSchemaName}`,
                    },
                  },
                },
              },
            },
          },
        };
      }
    }
  }

  const registered = new Set(Object.keys(spec.components.schemas));
  const specStr = JSON.stringify(spec);
  const refRegex = /"#\/components\/schemas\/([a-zA-Z0-9_]+)"/g;
  let match;
  while ((match = refRegex.exec(specStr)) !== null) {
    const refName = match[1];
    if (!registered.has(refName)) {
      spec.components.schemas[refName] = {
        type: 'object',
        description: `Typed entity: ${refName}`,
        additionalProperties: true,
      };
      registered.add(refName);
    }
  }

  spec.components.schemas.HardwareStateSnapshot = {
    type: 'object',
    description: 'Instantaneous snapshot of available PixelKit hardware telemetry states.',
    properties: snapshotProperties,
  };

  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });
  const publicApiDir = path.join(PUBLIC_DIR, 'api');
  if (!existsSync(publicApiDir)) mkdirSync(publicApiDir, { recursive: true });

  const jsonStr = JSON.stringify(spec, null, 2);
  writeFileSync(path.join(PUBLIC_DIR, 'openapi.json'), jsonStr, 'utf8');
  writeFileSync(path.join(publicApiDir, 'openapi.json'), jsonStr, 'utf8');

  const yamlStr = toYaml(spec).replace(/[ \t]+(?=\r?$)/gm, '').trim() + '\n';
  writeFileSync(path.join(PUBLIC_DIR, 'openapi.yaml'), yamlStr, 'utf8');
  writeFileSync(path.join(publicApiDir, 'openapi.yaml'), yamlStr, 'utf8');

  console.log(`[build-openapi] Generated public/openapi.json, public/api/openapi.json, and YAML variants (${files.length} hooks, ${Object.keys(spec.paths).length} paths).`);
}

try {
  generateOpenApi(await resolveSdkVersion());
} catch (error) {
  console.error(error.message);
  // exitCode, not exit(): exiting while fetch is still closing its socket crashes Node on Windows
  // (libuv UV_HANDLE_CLOSING assertion). Letting the loop drain gives the same non-zero code.
  process.exitCode = 1;
}
