import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  await db.query(`DELETE FROM files;`);
  await db.query(`DELETE FROM folders;`);

  const folderNames = ["Documents", "Images", "Videos"];
  const folders = [];

  for (const name of folderNames) {
    const { rows } = await db.query(
      `INSERT INTO folders(name)
      VALUES ($1)
      RETURNING *;`,
      [name]
    );
    folders.push(rows[0]);
  }

  for (const folder of folders) {
    for (let i = 1; i <= 5; i++) {
      await db.query(
        `INSERT INTO files(name, size, folder_id)
         VALUES ($1, $2, $3);`,
         [`files${i}_${folder.name}`, i * 100, folder.id]
      );
    }
  }
}