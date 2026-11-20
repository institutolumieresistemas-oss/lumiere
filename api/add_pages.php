<?php
$app = require __DIR__.'/bootstrap/app.php';

$db = $app->make('db');

$newPages = [
    [
        'id' => '66140c36-67a6-4e0b-9e20-6054b57a94f2',
        'name' => 'Licenciatura Online',
        'slug' => '/licenciatura-online',
        'status' => 'draft'
    ],
    [
        'id' => 'ea0f8bed-c5ed-40ff-b309-6da7e4d32c02',
        'name' => 'Licenciatura-Presencial',
        'slug' => '/licenciatura-presencial',
        'status' => 'draft'
    ],
    [
        'id' => '42e5af91-939f-4c23-8ef2-fb9a30f0776e',
        'name' => 'Licenciatura a Distancia',
        'slug' => '/licenciatura-a-distancia',
        'status' => 'draft'
    ],
    [
        'id' => '1fa22707-1248-4a75-afbf-adc48e3bc4a3',
        'name' => 'Preparatoria Online',
        'slug' => '/preparatoria-online',
        'status' => 'draft'
    ],
    [
        'id' => '9bfa901c-afac-4add-aef7-2b82ae27d9ea',
        'name' => 'Preparatoria Presencial',
        'slug' => '/preparatoria-presencial',
        'status' => 'draft'
    ],
    [
        'id' => '7325af41-ba52-47a5-b998-c9c1ddd27a4a',
        'name' => 'Preparatoria a Distancia',
        'slug' => '/preparatoria-a-distancia',
        'status' => 'draft'
    ],
    [
        'id' => '52179585-8ee0-4805-af47-e870ad023b49',
        'name' => 'Exani Online',
        'slug' => '/exani-online',
        'status' => 'draft'
    ],
    [
        'id' => '7ba25d99-5392-4190-b2d1-0b71b887ba7d',
        'name' => 'Exani Presencial',
        'slug' => '/exani-presencial',
        'status' => 'draft'
    ],
    [
        'id' => '7e9d22b5-1f5d-4974-b68b-f628c2836a2d',
        'name' => 'Exani a Distancia',
        'slug' => '/exani-a-distancia',
        'status' => 'draft'
    ]
];

foreach ($newPages as $p) {
    $exists = $db->select("SELECT id FROM pages WHERE id = ?", [$p['id']]);
    if (!empty($exists)) {
        echo "Page with ID {$p['id']} ({$p['name']}) already exists. Skipping.\n";
        continue;
    }

    $contentJson = json_encode([
        'version' => 1,
        'elements' => []
    ]);

    $db->insert(
        "INSERT INTO pages (id, name, slug, status, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        [$p['id'], $p['name'], $p['slug'], $p['status'], $contentJson]
    );

    $ruta = base_path('uploads/' . $p['id']);
    if (!file_exists($ruta)) {
        mkdir($ruta, 0777, true);
    }

    echo "Created page {$p['name']} with ID {$p['id']} and slug {$p['slug']}\n";
}
