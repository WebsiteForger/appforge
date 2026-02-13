import { WebContainer } from '@webcontainer/api';

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance;

  if (!bootPromise) {
    bootPromise = WebContainer.boot().then((wc) => {
      instance = wc;
      return wc;
    });
  }

  return bootPromise;
}

export function getWebContainerSync(): WebContainer | null {
  return instance;
}

export async function teardownWebContainer() {
  if (instance) {
    instance.teardown();
    instance = null;
    bootPromise = null;
  }
}
