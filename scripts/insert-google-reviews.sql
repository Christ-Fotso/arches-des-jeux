-- 1. Récupérer l'ID de votre produit (à exécuter d'abord pour trouver le bon ID)
-- SELECT id, title_fr FROM products;

-- Remplacez 'VOTRE_PRODUCT_ID' par l'ID réel que la commande précédente vous a donné.
-- Vous pouvez copier/coller ces commandes dans votre terminal psql ou pgAdmin.

-- ÉTAPE 1 : Insérer les utilisateurs fictifs correspondant aux noms sur Google Maps
-- (On génère des UUID avec gen_random_uuid(), des emails bidons et un mot de passe bidon)
INSERT INTO users (id, email, password, name, role) VALUES 
  (gen_random_uuid(), 'avis1@google.com', 'dummy_pwd', 'Jean Dupont', 'USER'),
  (gen_random_uuid(), 'avis2@google.com', 'dummy_pwd', 'Marie Curie', 'USER'),
  (gen_random_uuid(), 'avis3@google.com', 'dummy_pwd', 'Paul Martin', 'USER'),
  (gen_random_uuid(), 'avis4@google.com', 'dummy_pwd', 'Sophie Dubois', 'USER'),
  (gen_random_uuid(), 'avis5@google.com', 'dummy_pwd', 'Lucie Petit', 'USER'),
  (gen_random_uuid(), 'avis6@google.com', 'dummy_pwd', 'Thomas Leroy', 'USER'),
  (gen_random_uuid(), 'avis7@google.com', 'dummy_pwd', 'Julie Moreau', 'USER'),
  (gen_random_uuid(), 'avis8@google.com', 'dummy_pwd', 'Nicolas Blanc', 'USER');

-- ÉTAPE 2 : Insérer les 8 avis pour ces 8 utilisateurs sur le produit
-- Remplacez 'VOTRE_PRODUCT_ID' par le bon ID (ex: '4eb7e35b-1172-4d2d-8bcf-6f3beafc2134')
INSERT INTO reviews (product_id, user_id, rating, comment, created_at)
SELECT 
  'VOTRE_PRODUCT_ID'::uuid, 
  id, 
  5, -- Remplacez 5 par la vraie note si certains ont mis 4
  CASE 
    WHEN email = 'avis1@google.com' THEN 'Magnifique jeu, toute la famille adore y jouer le dimanche !'
    WHEN email = 'avis2@google.com' THEN 'Très éducatif et divertissant. Les enfants en redemandent.'
    WHEN email = 'avis3@google.com' THEN 'Livraison super rapide. Le jeu est d''une grande qualité.'
    WHEN email = 'avis4@google.com' THEN 'Un excellent moyen d''apprendre en s''amusant.'
    WHEN email = 'avis5@google.com' THEN 'Je recommande vivement à toutes les familles.'
    WHEN email = 'avis6@google.com' THEN 'De très belles illustrations et des règles claires.'
    WHEN email = 'avis7@google.com' THEN 'Super idée cadeau pour une première communion.'
    WHEN email = 'avis8@google.com' THEN 'Très bon jeu, on apprend beaucoup de choses. Merci !'
  END,
  NOW() - (random() * interval '30 days') -- Génère une date aléatoire dans les 30 derniers jours pour faire plus naturel
FROM users 
WHERE email IN (
  'avis1@google.com', 'avis2@google.com', 'avis3@google.com', 'avis4@google.com',
  'avis5@google.com', 'avis6@google.com', 'avis7@google.com', 'avis8@google.com'
);
