
INSERT INTO public.products (name, description, price, category_id, image_url, ingredients, occasion, is_available, is_featured, tags, sort_order)
SELECT
  v.name, v.description, v.price, c.id, NULL, v.ingredients, v.occasion, true, v.is_featured, v.tags, v.sort_order
FROM public.categories c,
(VALUES
  ('Red Velvet Cupcake', 'Classic red velvet cupcake topped with cream cheese frosting and red velvet crumbs. Moist, fluffy, and irresistible.', 180, 'Flour, cocoa powder, buttermilk, cream cheese, butter, sugar, red food colour', 'Birthday', true, ARRAY['bestseller', 'classic']::text[], 1),
  ('Chocolate Truffle Cupcake', 'Decadent chocolate cupcake with a rich ganache centre and whipped chocolate frosting. A chocolate lover''s dream.', 200, 'Dark chocolate, butter, flour, eggs, sugar, cocoa powder, cream', 'Anniversary', true, ARRAY['premium', 'chocolate']::text[], 2),
  ('Vanilla Bean Cupcake', 'Light and airy vanilla cupcake made with real vanilla beans, topped with silky vanilla buttercream swirl.', 160, 'Flour, vanilla beans, butter, eggs, sugar, milk, vanilla extract', 'Birthday', false, ARRAY['classic', 'vanilla']::text[], 3),
  ('Strawberry Bliss Cupcake', 'Fresh strawberry-infused cupcake with strawberry buttercream and a real strawberry slice on top.', 190, 'Flour, fresh strawberries, butter, eggs, sugar, cream, strawberry puree', 'Wedding', false, ARRAY['fruity', 'seasonal']::text[], 4)
) AS v(name, description, price, ingredients, occasion, is_featured, tags, sort_order)
WHERE c.slug = 'cupcakes';
