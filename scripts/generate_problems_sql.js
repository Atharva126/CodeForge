
import fs from 'fs';
import path from 'path';

// Helper to escape SQL strings
function escapeSqlString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/'/g, "''");
}

async function generateSql() {
    const problemsDataPath = path.join(process.cwd(), 'src', 'data', 'problemsData.ts');
    const outputPath = path.join(process.cwd(), 'supabase', 'migrations', 'seed_problems_data.sql');

    try {
        const fileContent = fs.readFileSync(problemsDataPath, 'utf-8');

        // Extract the array using regex
        // Looks for: export const problemsData: Problem[] = [ ... ];
        const arrayMatch = fileContent.match(/export const problemsData: Problem\[\] = (\[[\s\S]*?\]);/);

        if (!arrayMatch) {
            console.error('Could not find problemsData array in file');
            return;
        }

        let arrayString = arrayMatch[1];

        // Convert to valid JSON-like string for parsing
        // 1. Quote keys (id: -> "id":)
        arrayString = arrayString.replace(/(\w+):/g, '"$1":');
        // 2. Handle single quotes for strings (mostly) - this is tricky with content inside strings
        // safer to use eval() since it's local code, but let's try a safer eval
        // Actually, since we're in a module, we can just use eval()

        // Just use eval to get the object
        // We need to remove type annotations if any within the array, but usually data arrays are clean JS objects
        const problems = eval(arrayMatch[1]);

        let sql = `-- Seed data for problems table\n\n`;
        sql += `INSERT INTO problems (title, slug, difficulty, tags, acceptance_rate, companies, platform, description, examples, constraints) VALUES\n`;

        const values = problems.map(problem => {
            const tags = `'{"${problem.tags.join('","')}"}'`;
            const companies = `'{"${problem.companies.join('","')}"}'`;
            const examples = `'${JSON.stringify(problem.examples).replace(/'/g, "''")}'`;
            const constraints = problem.constraints ? `'{"${problem.constraints.map(c => c.replace(/"/g, '\\"').replace(/'/g, "''")).join('","')}"}'` : `'{}'`;

            return `(
  '${escapeSqlString(problem.title)}',
  '${escapeSqlString(problem.slug)}',
  '${problem.difficulty}',
  ${tags},
  ${problem.acceptance_rate},
  ${companies},
  '${problem.platform}',
  '${escapeSqlString(problem.description || '')}',
  ${examples}::jsonb,
  ${constraints}
)`;
        });

        sql += values.join(',\n') + ';\n'; // Use ON CONFLICT DO NOTHING to avoid duplicates if run multiple times? 
        // Actually, let's use ON CONFLICT (slug) DO UPDATE SET ...

        // Better: split into batches or handle conflicts. For now, simple insert.
        // Let's add ON CONFLICT DO NOTHING to be safe
        sql = sql.slice(0, -2) + '\nON CONFLICT (slug) DO UPDATE SET \n' +
            'title = EXCLUDED.title,\n' +
            'difficulty = EXCLUDED.difficulty,\n' +
            'tags = EXCLUDED.tags,\n' +
            'acceptance_rate = EXCLUDED.acceptance_rate,\n' +
            'companies = EXCLUDED.companies,\n' +
            'platform = EXCLUDED.platform,\n' +
            'description = EXCLUDED.description,\n' +
            'examples = EXCLUDED.examples,\n' +
            'constraints = EXCLUDED.constraints,\n' +
            'updated_at = NOW();\n';

        fs.writeFileSync(outputPath, sql);
        console.log(`Successfully generated SQL seed file at ${outputPath} with ${problems.length} problems`);

    } catch (error) {
        console.error('Error generating SQL:', error);
    }
}

generateSql();
