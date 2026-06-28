---
title: Java 8 Streams and Lambda
author: Samrat Saha
date: 2020-07-20
tags:
 - intermediate
 - java
categories:
 - technology
---

## The Change you need: Streams and Lambda
After learning about streams and lambdas in Java 8, my style of writing code underwent a fundamental change. It reduced bugs in my code, got me thinking more in terms of functional programming, and best of all — it reduced the number of lines I had to write for any given functionality while making the code even more readable!

<!-- more -->

However, if you are not familiar with streams and lambdas, this concept will seem very alien and you will stay away from it for the **REST OF YOUR LIFE!**

So I hope that after reading this post you will be able to avoid that fate :).

<img src="/lambda.jpg"/>

<sub>Where my Half-Life people at?</sub>

## What are Streams?
In Java 8, Streams were introduced and they basically allow us to write code in a more functional way. Streams are **LAZY**, meaning unless some terminal operation is performed on them, they will not execute and return a result.

How do you get a stream? The collections API has been enhanced to include the **`.stream()`** method which returns a stream. Let's look at an example.

```java
public class Main {
    public static void main(String[] args) {
        List<Integer> numList = new ArrayList<>();
        numList.add(1);
        numList.add(2);
        numList.add(3);
        numList.add(4);
        numList.add(5);
        numList.add(6);

        Stream<Integer> numStream = numList.stream();
    }
}
```

The above is how you will typically use it — you already have some collection and want to use stream programming. We can also directly initialize a stream.

```java
// Static method 'of(T t1, T t2....)' on the Stream interface.
// Useful for generating stream from a finite or small number of elements.
Stream<Integer> finiteNumStream = Stream.of(1, 2, 3, 4, 5, 6);

// Use `.iterate()` to get an infinite stream.
// 1st argument is the initial element.
// 2nd argument is a UnaryOperator (Function where input and output are the same type).
Stream<Integer> infiniteNumStream = Stream.iterate(0, num -> num + 1);

Stream<Integer> anotherInfiniteStream = Stream.generate(new Random()::nextInt);

// Limit the infinite stream to a fixed number of elements
infiniteNumStream.limit(10);
```

There are also classes to initialise streams for specific types. They include `IntStream, LongStream, DoubleStream`. These include the same static methods we saw above, plus extra methods specific to their data type. Worth checking out :)

## What is a Lambda?

If you have seen stream code before and got confused, I'm guessing it was because of the mysterious arrows that people keep throwing around. Those are lambdas.

I remember pulling my hair out because I couldn't understand their purpose or syntax.

::: tip Lambda Definition
A lambda is an anonymous function — it does not need a function name, input types, or a return type because those can be inferred.
:::

There are some simple rules for defining a lambda.

```java
// One input
a ->

// More than one input
(a, b, c, d, e) ->

// No input
() ->

// The arrow marks the end of input arguments and start of logic.
```

The above covers the rules for inputs.

```java
// Single-line body
a -> a + 1

// Single-line body returning boolean
a -> a == 1

// Multi-line body — use curly braces and semicolons
a -> {
    int next = a + 1;
}

// Multi-line body with return value
a -> {
    boolean result = false;
    if (a > 1 && a < 10) result = true;
    else result = false;
    return result;
}
```

The above covers the rules for the body and returning results.

::: danger Something's Strange..
But wait — how do we know the type of the input arguments, the type of the output, or even whether the function returns anything at all?
:::

If you asked that question, nice!! The answer is that it can all be inferred by the Functional Interface.

Look at these examples to understand better.

```java
// From the generics, `a` is inferred as Integer; nothing is returned.
Consumer<Integer> consInt = a -> a + 1;

// From the generics, `a` is Integer and return type is also Integer.
Function<Integer, Integer> funcInt = a -> a + 1;

// The same effect in method declarations:
public void methodCons(Consumer<Integer> consumer) { ... }
public void methodFunc(Function<Integer, Integer> function) { ... }

// When using these methods we can directly pass a lambda
methodCons(a -> a + 1);
methodFunc(a -> a + 1);
```

::: warning Note
I would advise you to read the post on [Functional Interfaces](./java_8_features.html#function-interface) first if mentions of Functional Interfaces feel alien to you.
Also look at [this](./java_8_features.html#way-1) to appreciate lambdas a bit more.
:::

::: warning Note
Did you notice above how the **same** lambda expression can mean different things depending on context?
:::

That's basically all there is to lambdas. There is also an alternative way to use Functional Interfaces called **Method References**.

## Stream Operations And Lambdas
Earlier I said streams allow us to write code in a functional way but I didn't say how — let's take a look at some examples. I'll also be using lambdas along the way. We'll first solve each problem the traditional way, then the Java 8 way.

### Problem 1

Find strings in a list which start with 'tr' and end with 'ed', with a max of 5 such strings. After finding them, get the length of each string and return the sum of those lengths.

```java
// Traditional Way
static String START = "tr";
static String END = "ed";

public long getSum(List<String> list) {
    int counter = 0;
    long sum = 0L;
    for (int i = 0; i < list.size(); i++) {
        if (list.get(i).startsWith(START) && list.get(i).endsWith(END)) {
            sum += list.get(i).length();
            counter++;
        }
        if (counter == 5) break;
    }
    return sum;
}
```

A traditional approach would more or less look like the above. It has variables for maintaining `count` and `sum`. We iterate the loop, check the condition, add the size to sum if it matches, check if we've hit 5 elements then break, and finally return `sum`.

```java
// Java 8 Way
static String START = "tr";
static String END = "ed";

// filter by condition, take only 5 elements, get size of each string, return sum
public long getSum(List<String> list) {
    return list.stream()
        .filter(s -> s.startsWith(START) && s.endsWith(END))
        .limit(5)
        .mapToLong(s -> s.length())
        .sum();
}
```

The above solution looks great! It's much simpler to understand and very compact.

Here, `filter` is an operation/method on Stream that accepts a predicate. If you've read the post on [Functional Interfaces](./java_8_features.html#predicate-interface), you'll remember that the `Predicate` interface takes some input, applies some logic, and returns a boolean. Our logic here is matching the start and end of the string.

We looked at `limit()` earlier — it limits the number of elements passed to the next stage.

Now let's take a look at `map`, because you'll be using it all the time. There are many methods starting with `map` on streams, and they all basically transform a value. Here we're transforming from `String` to the string's length (`Integer`). If you look closely at `map` methods you'll find they all accept some kind of `Function` interface.

::: tip Remember
Streams are lazy by nature, so the `sum` method is very important here — calling it signals the start of processing since it's a terminal operation.
:::

#### Time complexity
The time complexity of the traditional approach is O(n). What do you think the complexity is for the stream approach? It's O(n) as well. It's important to understand why.

When you use streams, every operation is performed one element at a time — an element has to pass through all operations before the next element is picked up. It follows the same pattern as the traditional approach if you think about it.

There are some exceptions to this rule: if an element is filtered out partway through, the next element can start. Operations like `filter` can drop elements before they reach the next stage.

### Problem 2
You are given a list of lists of strings. Check each nested list to see if it has at least 5 elements. Trim all strings, remove any that are reserved keywords, and return only the unique strings.

```java
// Traditional Way

public Set<String> getUniqueStrings(List<List<String>> allLists, Set<String> reservedKeywords) {
    Set<String> result = new HashSet<>();
    for (List<String> nestedList : allLists) {
        if (nestedList.size() > 4) {
            for (String str : nestedList) {
                String trimmed = str.trim();
                if (!reservedKeywords.contains(trimmed))
                    result.add(trimmed);
            }
        }
    }
    return result;
}
```

The traditional way actually doesn't look that bad, does it? Let me know :)

Let's move on to the Java 8 way.

```java
// Java 8 Way

public Set<String> getUniqueStrings(List<List<String>> allLists, Set<String> reservedKeywords) {
    return allLists.stream()
        .filter(list -> list.size() > 4)
        .flatMap(list -> list.stream())
        .map(str -> str.trim())
        .filter(str -> !reservedKeywords.contains(str))
        .collect(Collectors.toSet());
}
```

Most of these stream operations should look familiar by now. The new ones here are `flatMap` and `collect`.

`map` and `flatMap` are very similar, except that `flatMap` expects the lambda itself to return a stream — and then it _flattens_ all those returned streams into one. Flatten here means joining all such streams and returning a single stream. We need this because our subsequent operations work on individual strings, not on individual lists.

```java
// Function Signature in map
Function<A, B>

// Function Signature in flatMap
Function<A, Stream<B>>
```

The `collect` operation allows us to convert a stream into a Collection. Why not just return a Stream? Remember, streams are lazy — unless we perform a terminal operation (`collect` is terminal), no processing has actually occurred. So returning a Stream would mean doing no real work (_although ultimately it's up to you to decide what your methods should return; here we want a `Collection`_).

The `collect` operation is aptly named — it lets us _collect_ our stream into a collection, and it's also a terminal operation. It accepts a `Collector`, and the `Collectors` utility class provides a ton of ready-made ones. We could have used `Collectors.toList()` if the problem didn't require uniqueness. The `Collectors` class is very powerful with lots of useful methods, so do check it out!

### Problem 3

You are given a list of strings. Group the strings by their length and return a `Map<Integer, List<String>>` where the key is the length and the value is the list of grouped strings.

The traditional way is pretty straightforward.

```java
// Traditional Way

public Map<Integer, List<String>> groupBySize(List<String> list) {
    Map<Integer, List<String>> result = new HashMap<>();
    for (String str : list) {
        int key = str.length();
        if (result.containsKey(key)) {
            result.get(key).add(str);
        } else {
            List<String> newList = new ArrayList<>();
            newList.add(str);
            result.put(key, newList);
        }
    }
    return result;
}
```

Now for the Java 8 way! Behold!

```java
// Java 8 Way

public Map<Integer, List<String>> groupBySize(List<String> list) {
    return list.stream()
        .collect(Collectors.groupingBy(
            str -> str.length(),
            HashMap::new,
            Collectors.mapping(str -> str, Collectors.toList())
        ));
}
```

This is one of those times where I'm a little afraid to say the Java 8 way is better or more readable... but once you spend some time with the API docs, it genuinely does become true.

So let's recall what we want to do — just group strings by their length.

For that, we use the `Collectors.groupingBy` API. We need a way to tell it how to derive a key from a given string. That's what line 1 of the collect call does.

The second argument gives us the freedom to specify the `Map` implementation we want returned. Options like `HashMap`, `TreeMap`, and `LinkedHashMap` are all available — we've gone with `HashMap` here.

Finally, the third argument lets us tell the API that we want to group values into a `List`. Here too we could have used another collection like a `Set` or even another `Map`.

## Conclusion
So that's it for Streams and Lambdas! There are plenty more things you can do with them, so go read the API docs!
