---
title: Java 8 Functional Interfaces
author: Samrat Saha
date: 2020-07-18
tags:
 - intermediate
 - java
categories:
 - technology
---

## Java 8? Isn't it very old now?
Yes, Java 8 has become quite old, but it's still the most popular Java version in use today. In this post we'll go through some Java 8 features and try to understand them. I find many of them really useful and thought it would be awesome to share them.

<!-- more -->

![java_beans](/java_beans.jpg)

::: warning Note
Originally I had planned to cover many features but the post was getting very long, so I will break it into several smaller posts. This one covers functional interfaces.
:::

[[toc]]

## Before diving into the features..
There is something called generics in Java, and many of the features we'll look at use them heavily. What are generics? They allow you to write classes, methods, and collections with type safety.

```java
public class Main {

    public static void main(String[] args) {
        List<String> nameList = new ArrayList<>();
        // addAll(nameList) <--- This wont compile!
    }

    public static Long addAll(List<Integer> numList) {
        long sum = 0;
        for (int num : numList) sum += num;
        return sum;
    }
}
```

In the above example, using the `addAll()` method with `nameList` won't work because their types don't match. So the compiler throws an error and stops us from doing something stupid.
One thing to keep in mind: type information is only maintained at compile time and is removed at runtime — this is called **Type Erasure** in Java.

::: tip Think
Ever wondered why the compiler throws an error when you try to use method overloading with generics?
:::

```java
public class Main {

    // This class wont compile
    public void doSomething(List<String> nameList) {
    }

    public void doSomething(List<Integer> numList) {
    }
}
```

The compiler complains because at runtime the `<Integer>` and `<String>` parts are removed, and then both method signatures look exactly the same — they both have the same name and accept a `List<Object>`.


## Functional Interfaces

In Java 8, a new package **java.util.function** was introduced. This package contains a total of 43 functional interfaces. Does that mean all functional interfaces are defined in this package? No — there are others that existed before Java 8, and we'll note those later. You don't need to memorise every interface (I certainly don't), but we'll go through a few core ones since many of the others are just variations of these.

::: tip Definition
An interface which only consists of a _single abstract_ method is called a **Functional Interface.**
:::

Let's look at some of them. In this section you'll only find descriptions — the actual usage comes in subsequent sections. The functional interfaces shown here will only display the abstract method (they do contain other methods too), which is enough for our understanding.

### Function Interface

::: warning Note
Do not get confused between Function and Functional. Function Interface is one of the types of Functional Interfaces in Java.
:::

What is a function? A function is something that takes an input and gives an output. That's basically the Function Interface (and all other interfaces also have similarly one-liner definitions).

Let's look at the interface definition.

```java
public interface Function<T, R> {
    R apply(T t);
}
```

**Don't let the generics scare you!** The interface signature **`Function<T, R>`** just says that **`T`** is the type of the input parameter and **`R`** is the type of the output parameter. The **`R apply(T t)`** method makes this clear.

Also worth noting: when an interface has 2 type parameters, the first one is usually for input and the second is for output. This isn't a rule, just a general convention — you'll find plenty of examples where it isn't followed.

Even though I said we'd look at usage later, let's have a quick preview so you stay interested :P

Let's say you're writing a method that:
- Encodes a string in a particular format and returns the encoded string.
- The strings are actually built from a Java class.
- The string represents that class in one of 2 formats: JSON or XML.

First, let's write the parts of the code that aren't directly relevant to our example.

```java
public class Main {
    // skipping getter/setters to avoid clutter
    public static class Person {
        public String name;
        public int age;
        public Person(String name, int age) { this.name = name; this.age = age; }
    }

    public static class PersonToJson {
        public String toJsonString(Person person) {
            return "{name:" + person.name + ", age:" + person.age + "}";
        }
    }

    public static class PersonToXml {
        public String toXmlString(Person person) {
            return "<Person><name>" + person.name + "</name><age>" + person.age + "</age></Person>";
        }
    }
}
```

Now that we have the POJOs and converters ready, let's write our method.

```java
// Without Functional interface — method overloading per converter type
public String encodeToUTF8(PersonToJson jsConverter, Person person) {
    String json = jsConverter.toJsonString(person);
    return new String(json.getBytes(), "UTF-8");
}

public String encodeToUTF8(PersonToXml xmlConverter, Person person) {
    String xml = xmlConverter.toXmlString(person);
    return new String(xml.getBytes(), "UTF-8");
}
```

That was without a Functional interface. Now let's do it with one.

```java
public static String encodeToUTF8(Function<Person, String> converter, Person person) {
    String result = converter.apply(person);
    return new String(result.getBytes(), "UTF-8");
}
```

See how much it simplified things!

How would someone use this method? I see 2 ways (though only one is really practical).

#### Way 1
(Don't worry if you don't understand this — move on to Way 2)

```java
public static void main(String[] arr) {
    Person person = new Person("Immortal", 10000);

    Function<Person, String> jsonFunc = new Function<Person, String>() {
        PersonToJson jsonConverter = new PersonToJson();
        @Override
        public String apply(Person p) {
            return jsonConverter.toJsonString(p);
        }
    };

    Function<Person, String> xmlFunc = new Function<Person, String>() {
        PersonToXml xmlConverter = new PersonToXml();
        @Override
        public String apply(Person p) {
            return xmlConverter.toXmlString(p);
        }
    };

    String json = encodeToUTF8(jsonFunc, person);
    String xml = encodeToUTF8(xmlFunc, person);
}
```

#### Way 2
(or as I like to call it, the Java 8 way)

```java
public static void main(String[] arr) {
    Person person = new Person("Immortal", 10000);
    PersonToJson jsonConverter = new PersonToJson();
    PersonToXml xmlConverter = new PersonToXml();

    String json = encodeToUTF8(p -> jsonConverter.toJsonString(p), person);
    String xml = encodeToUTF8(p -> xmlConverter.toXmlString(p), person);
}
```

We've used a Java 8 feature called Lambda. Lambdas are basically anonymous methods — no need for all the **`new Function()`** boilerplate. As you'll see, functional interfaces were designed to be used with lambdas.

Now that we have an idea of how they're used, let's quickly go through the rest of the interfaces.

::: tip
Checkout [this](./java_8_streams.html#what-is-a-lambda) on lambdas to learn more!
:::

### Consumer Interface
The Consumer Interface is very simple — it takes an input of type **`T`** and does something with it, but doesn't return anything. That's why its return type is **`void`**.

What are some existing methods with this behaviour? Think of **`System.out.println`** — it takes an input object and prints it to the console.

```java
public interface Consumer<T> {
    void accept(T t);
}
```

You can write sysout as below,

```java
Consumer<Object> consumer = o -> System.out.println(o);
```

cool right?

### Supplier Interface
The Supplier Interface is the opposite of the Consumer Interface — it only returns something of type **`T`**.

This might seem strange. Just return something with no input? **Of course you can!**
A pure example of this is a Random Number Generator.

```java
public interface Supplier<T> {
    T get();
}
```

### Predicate Interface
The Predicate Interface tests an expression and returns a boolean. It accepts an input of type **`T`**.

```java
public interface Predicate<T> {
    boolean test(T t);
}
```

If you've been paying attention, you'll notice that Predicate Interface is a special case of Function Interface — one that takes type **`T`** as input and returns a **`boolean`**.

So it can be written as,

```java
public interface Function<T, Boolean> {
    Boolean apply(T t);
}
```

### Other Interfaces
There are other interfaces that are just variations of the ones above. Some have a **Bi** prefix, meaning they accept 2 input arguments, which can be of different types.

So there is BiConsumer, BiPredicate, and BiFunction. For example,

```java
public interface BiConsumer<T, U> {
    // method takes in 2 parameters instead of 1, hence the name Bi
    void accept(T t, U u);
}
```

Why do these exist? Because it's a common use case — you often write methods that accept 2 parameters.

But what happens when you need more than 2 parameters? In that case you can work around it with a BiFunction by partially supplying one of the values.

```java
String outside = "";
// This function takes 2 inputs String, String.
// As our function closes over the context (variable `outside`), it can also be called a closure.
BiFunction<String, String, Integer> func =
    (a, b) -> Integer.parseInt(a + b + outside);
```

Of course, it's not always possible to have any of the 3 values available at declaration time — in those cases there are other alternatives, including defining your own interfaces.

There are also other variations like Predicate, which is a special case of Function as we saw earlier. Other examples are `LongConsumer, IntConsumer, DoubleToLongFunction`, and so on. You'll notice these variations involve primitives rather than `Long, Integer, Boolean`.

::: tip Why do these special variations exist?
These special variations with primitives exist because people want to avoid autoboxing (which can use extra memory compared to primitives) — and also because generics don't support primitives.
:::

There are also functional interfaces outside this package, like the Runnable Interface. Runnable takes nothing and returns nothing — pretty simple, right?

::: tip Remember
What makes an interface a Functional Interface is having only one abstract method.
:::

Anyways that's all for now. I'll write about Lambdas, Streams, and Method References next, as those are needed for more clarity on actually using Functional Interfaces.
