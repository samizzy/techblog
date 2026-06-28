---
title: "Solid Principles Part 1 : The L in SOLID"
author: Samrat Saha
date: 2020-05-25
tags:
 - intermediate
 - design principle
 - scala
categories:
 - technology
---

## The Dreaded Liskov Substitution Principle
There is something called SOLID design principles in Object Oriented programming. It is said that an OO programmer should always know SOLID and apply them religiously in their daily life. We are going to take a look at the L in SOLID, which — like all the other principles — is widely misunderstood.

<!-- more -->

[[toc]]

## How is SOLID different from Design Patterns and why should I try to learn it?
When I first heard of SOLID, I thought **_"I have studied a LOT of Design Patterns, there is probably NOTHING a PUNY set of 5 principles can TEACH ME"_**. Okay, I probably didn't think exactly like that, but more or less. I later realised that most of the problems a software developer faces can be solved just by properly applying these principles. Design patterns are important because they teach you how to deal with specific, well-defined problems and write maintainable code — but SOLID principles tell you how to approach any code.

## Definition of Liskov Substitution Principle
::: tip Definition
"_Let **Φ(x)** be a property provable about objects **x** of type **T**. Then **Φ(y)** should be true for objects **y** of type **S** where **S** is a subtype of **T**._"
:::
When I first read this, I seriously considered skipping this principle. So I've tried to write about it in a way that simple people like me can understand.

Consider we have 2 classes S and T where S is a sub (child) class of T. It should always be possible to substitute instances of S wherever there are instances of T without breaking the code — i.e., **the code should not need additional changes to accommodate S**.

## Misunderstanding
Reading the definition, you might think that in strongly typed languages like Java or Scala, the compiler will give you an error if you're not conforming to the parent class when using inheritance. So of course you'd be able to substitute a child class object wherever a parent class object is used. I also read somewhere that this principle was initially popularised by Ruby users since they didn't have strong typing. This might lead you to think there's nothing more to learn here — the language takes care of it for you. But that's not really true. While the language does handle the substitution check, we still need to take care of the runtime behaviour ourselves :)

## Square and Rectangle Problem
There is a popular Square and Rectangle example on the internet and I'd like to use it too. So, let's say we define a Rectangle class and then use _inheritance_ to _define_ a Square class, based on the fact that "**Every Square is a Rectangle but not every Rectangle is a Square**".

```scala
class Rectangle {
    private var x: Float
    private var y: Float

    def setWidth(x: Float) = this.x = x
    def setHeight(y: Float) = this.y = y
    def getWidth = x
    def getHeight = y
    def getArea(): Float = getHeight * getWidth
}

class Square extends Rectangle {
    private var side: Int

    def setWidth(x: Float) = side = x
    def setHeight(y: Float) = side = y
    def getWidth = side
    def getHeight = side
}
```

You're very happy — you've managed to represent Square in terms of Rectangle and can now use polymorphism in your code! Great.
However, you soon find that at runtime your code is failing in certain places or showing strange behaviour.

Let's say in some part of your codebase you have code like this,

```scala
def nextSquare(): Rectangle = { // using subtyping to return an instance of Square as Rectangle
    val side = getSide() // Some source of side like files/database or web api
    var rect = new Square()
    rect.setWidth(side)
    rect
}
```

and in some other part you have code like this,

```scala
def adjust(list: List[Rectangle], factor: Float): List[Rectangle] =
    list.map(rect => getAdjustedRectangle(rect, factor))

// code that will adjust the height and the width differently
def getAdjustedRectangle(rect: Rectangle, factor: Float): Rectangle = {
    rect.setHeight(rect.getHeight * factor)
    rect.setWidth(rect.getWidth * (1.0 - factor))
    rect
}
```

The caller expects `getAdjustedRectangle` to adjust the rectangle along both axes by different factors. It doesn't know whether it's dealing with a Square or a plain Rectangle. Since a square has only one side, the `setWidth` call at `rect.setWidth(rect.getWidth * (1.0 - factor))` overrides the height value that was just set, causing it to be lost.

This behaviour violates the Liskov Substitution Principle as it presents unexpected behaviour. To solve this you think of a solution,

```scala
def adjust(list: List[Rectangle], factor: Float) = list.map(rect => {
    if (rect.isInstanceOf[Square]) getAdjustedSquare(rect.asInstanceOf[Square], factor)
    else getAdjustedRectangle(rect, factor)
})

// You asked some domain expert how the side of a square should change, and he said simply multiply by factor
def getAdjustedSquare(square: Square, factor: Float): Rectangle = {
    square.setHeight(square.getHeight * factor)
}
```

As a quick workaround you've checked whether the rectangle is an instance of Square, but you're still violating the principle by introducing special-case code to handle this _breaking_ behaviour :)

### Initial Solution

So what can you do? How can you solve this shizzle? Well, one of the most popular [stackoverflow answers](https://stackoverflow.com/questions/56860/what-is-an-example-of-the-liskov-substitution-principle) suggests that we should model our classes according to behaviour, not data properties. We modelled our classes to satisfy the mathematical rule "**Every Square is a Rectangle but not every Rectangle is a Square**" — and that's what leads us into this mess.

Let's try to solve this problem. This is my take on it; people might have different solutions.

The core of the problem is our class modelling. So let's ask: on what basis should we model our classes? Domain model? Mathematical model? Or do we mostly just go with the flow and change things ad-hoc? I think we should design our classes according to behaviour, and to understand what behaviour a class should have we should look at the requirements spec.

Let's say the spec says,
- Shapes are needed for a drawing application.
- We only have demand for square, rectangle and circle for now.
- Squares, rectangle must have ability to invert color.

So let's start coding. First, let's define our abstractions for the behaviours.

```scala
// since its a drawing application shape will need to be drawable and have color
abstract class Shape extends Colorable with Drawable {
    def area(): Double
    def perimeter(): Double
}

// traits are like interfaces in java
trait Drawable {
    def draw(): Unit // Unit is scala's equivalent of void
}

trait Colorable {
    def color: Color
}

trait ColorInvertor {
    def invert(color: Color): Color
}

trait ColorInvertible[S] { // inherited by shape classes
    def invert(): S // immutable: returns a new instance with inverted color
}

abstract class FourEdgedShape extends Shape with ColorInvertible[Shape]
```

The code above is self-explanatory. Now let's define our data classes.

```scala
sealed abstract class ShapeDS
// Data classes; case classes are immutable in nature
case class RectangleDS(height: Int, width: Int) extends ShapeDS
case class SquareDS(side: Int) extends ShapeDS
case class AxisDS(foci: Int, length: Int) extends ShapeDS

// Color Data
case class Color(r: Int, b: Int, g: Int)
```

Finally, we can provide concrete implementations for our abstract classes and traits.

```scala
case class Rectangle(rect: RectangleDS, color: Color)(implicit inverter: ColorInvertor) extends FourEdgedShape {
    def area() = rect.height * rect.width
    def perimeter(): Double = 2 * (rect.width + rect.height)
    def draw() = println(s"Drawing Rectangle ${rect} with color ${color}")
    def invert(): Rectangle = copy(color = inverter.invert(color))
}

case class Square(square: SquareDS, color: Color)(implicit inverter: ColorInvertor) extends FourEdgedShape {
    def area() = square.side * square.side
    def perimeter(): Double = 4 * square.side
    def draw() = println(s"Drawing Square ${square} with color ${color}")
    def invert(): Square = copy(color = inverter.invert(color))
}

case class Circle(axis: AxisDS, color: Color) extends Shape {
    def area() = Math.PI * axis.length * axis.length
    def perimeter() = 2 * Math.PI * axis.length
    def draw() = println(s"Drawing Circle ${axis} with color ${color}")
}
```

Now let's write our main class for some testing.

```scala
object LiskovTest {

    // implicit keyword: the compiler will pass this value wherever it is required implicitly
    implicit val stdColorInverter: ColorInvertor = new ColorInvertor {
        override def invert(color: Color): Color = Color(r = 255 - color.r, g = 255 - color.g, b = 255 - color.b)
    }

    def main(args: Array[String]): Unit = {
        val color = Color(210, 100, 0)
        val rect = Rectangle(RectangleDS(10, 12), color)
        val square = Square(SquareDS(10), color)
        val circle = Circle(AxisDS(10, 10), color)

        // Standard polymorphism: child classes are implicitly cast to Shape
        printShapes(rect, square, circle)
        printFourEdged(rect, square)
        // Below line will not compile as circle is not FourEdgedShape
        // printFourEdged(rect, square, circle)
    }

    def printShapes(shapeList: Shape*): Unit = shapeList.map(printArea).foreach(println)

    def printArea(shape: Shape): Shape = {
        println(shape.area())
        shape
    }

    def printFourEdged(fourEdgedList: FourEdgedShape*): Unit = fourEdgedList.map(_.invert()).foreach(println)
}
```

The code may not light any bulbs in your mind and might seem obvious as you read it — which is probably a good thing, since it suggests clarity in the code.

### Reflecting on previous solution and adding new requirement

Okay, let's recap. What advantages does the current model give us? We've defined Shape with abstract methods like `def area(): Double`, `def perimeter(): Double`, `def draw(): Unit`. We've separated behaviour from data — we haven't embedded fields like height/width inside the Rectangle class itself.
Imagine a new requirement comes in to add a `center` field. Even though the field lives on the shape object, there's no logic related to it in the shape object itself — it's some higher-level code, say the UI, that actually needs it for display purposes.

It won't stop there either. More fields that have nothing to do with shape logic may keep getting added. This is a common occurrence in software development as requirements change and we adapt. It can eventually turn the shape object into a **GOD** object — one that needs to change with every requirement and becomes a source of many bugs. With every change and bug fix you have to write test cases, test this class and all the dependent classes too, and it becomes quite a headache. The code grows difficult to maintain, and eventually nobody wants to touch this class because it might break something else :sob:. The fix for this falls under another principle called the Single Responsibility Principle.

Ok, let's get back to the shape example. Up until now our code obeys LSP — there's no breaking change in the behaviour of subtypes. Let's add a requirement: shapes should be adjustable, i.e., we should be able to manipulate their dimensions.

There are 2 ways to go about this.
- take a `factor : Float` and get new dimensions by multiplying it to _some_ or _all_ the dimensions of shape object.
- take delta change from the user for each dimension, which may increase/decrease particular dimensions.

With the 1st approach, we can define a generic method on the Shape abstract class that accepts a factor and returns a new Shape object with adjusted dimensions. But with the 2nd approach we need to think about how to accept different dimensions for each concrete Shape while still defining a generic method on Shape.

Is the 2nd approach possible? From what I've researched, there's no compile-time-friendly way to do it. We could try a modified Visitor pattern that accepts a visitor with 2 arguments, but that's not elegant at all. Let's fall back to runtime and look at other options.

### Intro to Pattern Matching

Let's say we define an adjust method like below

```scala
abstract class Shape extends Colorable with Drawable {
    def area(): Double
    def perimeter(): Double
    def adjust(ds: ShapeDS): Shape
}
```

We didn't talk about the ShapeDS class before. Its signature is `sealed abstract class ShapeDS` and it has no content. So what use is this class? Since there are no methods defined on it, it's practically useless as a superclass. There is only one use for it: **Type Safety**. It's also called a marker interface — it has no methods and can only be used to _mark_ a subclass. For it to be truly useful, we need to know the type of the subclass at runtime.

To work with subtypes in Scala there is a concept called **Pattern Matching**. Let's quickly understand it with an example.

```scala{9,11,13}
object Main {
    sealed trait Animal
    trait Pet extends Animal
    trait Wild extends Animal

    case class Dog(name: String) extends Pet
    case class Tiger(name: String) extends Wild

    def handleAnimal(animal: Animal): Unit = {
        animal match {
            case Dog(name) => println(s"Take $name for a walk")
            case Tiger(name) => println(s"Do not approach $name, watch from afar.")
            case _ =>
        }
    }
}
```

We've defined a method `def handleAnimal(animal: Animal): Unit`, which takes an instance of Animal and returns Unit. For the uninitiated, Unit in Scala means the function doesn't return anything meaningful. Inside the method we check if the animal matches an instance of Dog or Tiger and perform logic accordingly. It is similar to using the instanceof operator to check the instance type, but pattern matching in Scala has compile-time safety. In Java nothing stops you from checking if an Integer is instanceOf String, but in Scala that would be a compile-time error.

Pattern matching is very powerful and used heavily throughout Scala. In its most primitive form it's like the instanceof operator — the `match` keyword with the `case` keyword checks for instanceof Dog/Tiger and runs some logic with that instance.

::: tip Remember
The main benefit of pattern matching is that it provides compile time safety as compared to simply using instanceOf methods.
:::

### Apply Pattern Matching to Our Shapes problem

So let's change our code to use Pattern Matching. I'm only showing the changes for the Rectangle class since the others are similar.

```scala
// Add an adjust method that accepts a ShapeDS and returns a Shape
abstract class Shape extends Colorable with Drawable {
    def area(): Double
    def perimeter(): Double
    def adjust(delta: ShapeDS): Shape
}

case class Rectangle(rect: RectangleDS, color: Color)(implicit inverter: ColorInvertor) extends FourEdgedShape {
    def area() = rect.height * rect.width
    def perimeter(): Double = 2 * (rect.width + rect.height)
    def draw() = println(s"Drawing Rectangle ${rect} with color ${color}")
    def invert(): Rectangle = copy(color = inverter.invert(color))

    // check to see if ShapeDS matches current Shape; if not throw exception, otherwise adjust and return
    def adjust(delta: ShapeDS): Rectangle = {
        val newDS = delta match {
            case RectangleDS(height, width) => RectangleDS(rect.height + height, rect.width + width)
            case _ => throw new IllegalArgumentException("Expected delta of type RectangleDS")
        }
        copy(rect = newDS)
    }
}
```

Usually when pattern matching is used, it covers the full range of subtypes — unlike what we did here, where we only match one subtype at a time.

Now you might want to come at me and point out that I earlier condemned using `rect.isInstanceOf[Square]`. Yes, that's fair — it breaks the behaviour of subclasses, and YES it breaks in our example above too. **In fact, you can pass an AxisDS type to a Rectangle Shape without a compile-time error... which is really bad**. What I'm saying is, sometimes it's OK to break the LSP :P. You should treat a principle as a guideline — if it doesn't suit your use case, you may need to break it.

That said, we can definitely improve on this solution. I can't figure out why we'd want a generic method at the Shape abstract level, because the client will also have to provide the appropriate DS object for each Shape :rage: — it would probably also need to check the type of the shape using pattern matching. If that's the case, we might as well define our adjust method at the individual shape level and enjoy proper type safety.

### Improving our solution

Let's move the adjust method to its own trait.

```scala
abstract class Shape extends Colorable with Drawable {
    def area(): Double
    def perimeter(): Double
}

// the +/- signs are variance annotations and don't affect the core solution
trait Adjustable[-DS, +S] {
    def adjust(ds: DS): S
}
```

Now let's define the adjust method at the individual Shape level

```scala{7,16,24}
case class Rectangle(rect: RectangleDS, color: Color)(implicit inverter: ColorInvertor)
    extends FourEdgedShape with Adjustable[RectangleDS, Rectangle] {
    def area() = rect.height * rect.width
    def perimeter(): Double = 2 * (rect.width + rect.height)
    def draw() = println(s"Drawing Rectangle ${rect} with color ${color}")
    def invert(): Rectangle = copy(color = inverter.invert(color))
    override def adjust(ds: RectangleDS): Rectangle = copy(rect = RectangleDS(rect.height + ds.height, rect.width + ds.width))
}

case class Square(square: SquareDS, color: Color)(implicit inverter: ColorInvertor)
    extends FourEdgedShape with Adjustable[SquareDS, Square] {
    def area() = square.side * square.side
    def perimeter(): Double = 4 * square.side
    def draw() = println(s"Drawing Square ${square} with color ${color}")
    def invert(): Square = copy(color = inverter.invert(color))
    override def adjust(ds: SquareDS): Square = copy(square = SquareDS(square.side + ds.side))
}

case class Circle(axis: AxisDS, color: Color) extends Shape with Adjustable[AxisDS, Circle] {
    def area() = Math.PI * axis.length * axis.length
    def perimeter() = 2 * Math.PI * axis.length
    def draw() = println(s"Drawing Circle ${axis} with color ${color}")
    override def adjust(ds: AxisDS): Circle = copy(axis = AxisDS(axis.foci + ds.foci, axis.length + ds.length))
}
```

Now let's see how a client might use this code.

```scala
object LiskovTest {

    implicit val stdColorInverter: ColorInvertor = new ColorInvertor {
        override def invert(color: Color): Color = Color(r = 255 - color.r, g = 255 - color.g, b = 255 - color.b)
    }

    def main(args: Array[String]): Unit = {
        val color = Color(210, 100, 0)
        val rect = Rectangle(RectangleDS(10, 12), color)
        val square = Square(SquareDS(10), color)
        val circle = Circle(AxisDS(10, 10), color)

        val shapes = List(rect, square, circle)
        println(s"\nBefore Adjusting: $shapes")

        val adjustedShape = adjustShapes(shapes)
        println(s"\nAfter Adjusting: $adjustedShape")
    }

    def adjustShapes(shapeList: List[Shape]): List[Shape] = {
        shapeList.map {
            case sh @ Square(_, _)    => sh.adjust(SquareDS(-2))
            case sh @ Rectangle(_, _) => sh.adjust(RectangleDS(-5, 10))
            case sh @ Circle(_, _)    => sh.adjust(AxisDS(5, -2))
            case _                    => sys.error(s"Cannot adjust unidentified shape")
        }
    }
}
```

::: warning Be careful
One thing to keep in mind is if such pattern matching code for different shapes is everywhere in your code base then when you are adding a new Shape you will have to search through all your code for adding it. So it is advised that you keep/restrict this code in one place/file.
:::

If we run this, the output is

::: tip Output
Before Adjusting: List(Rectangle(RectangleDS(10,12),Color(210,100,0)), Square(SquareDS(10),Color(210,100,0)), Circle(AxisDS(10,10),Color(210,100,0)))

After Adjusting: List(Rectangle(RectangleDS(5,22),Color(210,100,0)), Square(SquareDS(8),Color(210,100,0)), Circle(AxisDS(15,8),Color(210,100,0)))
:::

Anyway, that's all for now. Hope you learned something — leave a comment if you have questions!
