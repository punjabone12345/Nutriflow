import { getStore } from "@netlify/blobs";

const REG_STORE = "nutriflow-registrations";
const SENT_STORE = "nutriflow-sent";

export async function saveRegistration(reg) {
  const store = getStore(REG_STORE);
  await store.setJSON(`reg:${reg.token}`, {
    ...reg,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteRegistration(token) {
  const store = getStore(REG_STORE);
  await store.delete(`reg:${token}`);
}

export async function listRegistrations() {
  const store = getStore(REG_STORE);
  const { blobs } = await store.list();
  const regs = [];

  for (const b of blobs) {
    try {
      const reg = await store.getJSON(b.key);
      if (reg && reg.token) {
        regs.push(reg);
      }
    } catch {
      // Skip corrupt entries.
    }
  }

  return regs;
}

export async function markSent(token, meal, localDate) {
  const store = getStore(SENT_STORE);
  await store.set(`${token}:${meal}:${localDate}`, "1");
}

export async function isSent(token, meal, localDate) {
  const store = getStore(SENT_STORE);
  const v = await store.get(`${token}:${meal}:${localDate}`);
  return !!v;
}  
}
return regs;
}

// Duplicate-prevention: record that a reminder occurrence (token+meal+date)
// has been sent so the next scheduler run skips it.
export async function markSent(token, meal, localDate) {
  const store = getStore(SENT_STORE);
  await store.set(`${token}:${meal}:${localDate}`, "1");
}

export async function isSent(token, meal, localDate) {
  const store = getStore(SENT_STORE);
  const v = await store.get(`${token}:${meal}:${localDate}`);
  return !!v;
}
