export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('appforge-assets');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return Response.json({ error: 'Missing file or projectId' }, { status: 400 });
    }

    const key = `${projectId}/${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    await store.set(key, buffer as ArrayBuffer, {
      metadata: {
        contentType: file.type,
        originalName: file.name,
      },
    });

    // Return the blob URL
    const url = `/.netlify/blobs/appforge-assets/${key}`;

    return Response.json({ url, key });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return Response.json({ error: message }, { status: 500 });
  }
};
