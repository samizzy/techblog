---
title: The L in SOLID
author: Samrat Saha
date: 2020-05-25
tags:
 - beginner
 - intermediate
 - solid
 - design principle
 - scala
 - java
 - liskov substitution principle
categories:
 - technology
---
[[toc]]
# The Dreaded Liskov Substitution Principle
There is something called SOLID design principles in Object Oriented programming. It is said that an OO programmer should always know SOLID and apply them religiously in their daily life. We are going to take a look at the L in SOLID, which like all other principles is misunderstood.
<!-- more -->

## How is SOLID different from Design Patterns and why should I try to learn it?
When I first heard of SOLID, I thought **_"I have studied a LOT of Design Patterns, there is probably NOTHING a PUNY set of 5 principles can TEACH ME"_**. Okay, probably didn't exactly think like that but more or less that way. I later realised that most of the problems a software developer faces can mostly be solved just by properly applying these principles. Design patterns are important because they teach you how to deal with a certain defined problem and also write maintainable code but SOLID principles tell you how to approach any code.

## Definition of Liskov Substitution Principle
::: tip Definition
"_Let **Φ(x)** be a property provable about objects **x** of type **T**. Then **Φ(y)** should be true for objects **y** of type **S** where **S** is a subtype of **T**._"
:::
When I first read this, I seriously had the thought of skipping this principle. So I have tried writing it in a way that simple people like me can understand.

Consider we have 2 classes S and T such that there exists a relationship that S is a sub(child) class of T then it should always be possible to substitute instances of S wherever there are instances of T without breaking the code ie, **the code should not need additional changes to accomodate S**.

## Misunderstanding
By reading the definition, you would think in strongly typed languages like Java, Scala etc. when using inheritance, the compiler will give us error if we are not conforming to the parent class. So ofcourse we would be able to substitute child class object where parent class object are used. I also read somewhere, that this principle was initially used by Ruby users as they didnt have strong typing. So this would lead us to think that there is no need for us to know further than this as the language takes care of it for us but it is not really true. Though it is true that the language will take of substitution ability but we still need to take care of the runtime behaviour ourselves :)

## Square and Rectangle Problem
There is a popular example of Square and Rectangle on the internet and i would also like to use it. So, lets say we define a Rectangle class and then use _inheritance_ to _define_ a Square class,  as "**Every Square is a Rectangle but not every Rectangle is a Square**". 

``` scala
class Rectangle {
    private var x: Float
    private var y: Float

    def setWidth(x: Float) = this.x = x
    def setHeight(y: Float) = this.y = y
    def getWidth = x
    def getHeight = y
    def getArea(): Float = getHeight * getWidth
}

class Square extends Rectangle{
    private var side: Int

    def setWidtht(x: Float) = side = x 
    def setHeight(y: Float) = side = y
    def getWidth = side
    def getHeight = side
}
```

So you are very happy as you have managed to represent Square in terms of Rectangle and now you can use polymorphism in code! Great!.
However, soon you find that during runtime your code is failing at certain places or are seeing strange behaviour.

So lets say in some part of your code base you have code like this,
``` scala
    def nextSquare(): Rectangle = { // using subtyping to return an instance of Square as Rectangle
        val side = getSide() // Some source of side like files/database or web api       
        var rect = new Square() 
        rect.setWidth(x)
        rect
    }

```

and in some other part you have code like this,

``` scala
    def adjust(list: List[Rectangle], factor: Float): List[Rectangle] = list.map(rect => getAdjustedRectangle(rect, factor))

    //code that will adjust the height and the width differently
    def getAdjustedRectangle(rect: Rectangle, factor: Float): Rectangle = {
        rect.setHeight(rect.getHeight * factor)
        rect.setWidth(rect.getWidth * (1.0 - factor))
        rect
    }
```

 The caller of the code is expecting the getAdjustedRectangle method to adjust the rectangle in both axis by different factors. It doesnt know its a instance of Square or a pure rectangle. Since the square is having only one side, so at `rect.setWidth(rect.getWidth * (1.0 - factor))` it is getting overriden by this and there is loss of value of height.

 This behaviour violates the Liskov Substitution Principle as it presents unexpected behaviour. To solve this you think of a solution,

 ``` scala
    def adjust(list: List[Rectangle], factor: Float) = list.map(rect => {
        if(rect.isInstanceOf[Square]) getAdjustedSquare(rect.asInstanceOf[Square], factor)
        else getAdjustedRectangle(rect, factor)
    })

//You asked some domain expert how should the side of a square change and he said simply multiply by factor and not 1-factor
    def getAdjustedSquare(square: Square, factor: Float): Rectangle = {
      square.setHeight(square.getHeight * factor) 
    } 
 ```
As a fast work around you have checked if the rectangle is a instance of square
but you are still violating the principle by introducing special code to handle this _breaking_ behaviour :)

### Initial Solution

So what can you do??? How can you solve this shizzle?? Well one of the most popular [stackoverflow answer](https://stackoverflow.com/questions/56860/what-is-an-example-of-the-liskov-substitution-principle) for this suggest that we should model our class according to behaviour and not according to data properties. We modeled our classes to satisfy the mathematical model that "**Every Square is a Rectangle but not every Rectangle is a Square**" which leads us to this mess.

So let's try to solve this problem. This is my take on this and people might have different solutions.

So the core of the problem is our class modelling. So let us ask the question on what basis do we model our class? Domain or Mathemetical model or mostly people just go with the flow and change the code ad-hoc. I think we should try to design our classes according to behaviour and to know the behaviour a class should posses we should look at the requirement spec.

Lets say the spec says,
- Shapes are needed for a drawing application.
- We only have demand for square, rectangle and circle for now.
- Squares, rectangle must have ability to invert color.

So lets start coding, let us define our abstract things for behaviours first.

``` scala
//since its a drawing application shape will need to be drawable and have color within shape itself instead of defining
//sub type like drawableShape, ColorableShape etc. (As I said before lets follow the spec)
abstract class Shape extends Colorable with Drawable  {
  def area(): Double
  def perimeter(): Double
}

// traits are like interfaces in java
//Colorable method can be taken inside Drawable itself, I separated them
trait Drawable{
  def draw(): Unit // Unit represents no returns, jugaad for Void return type in scala
}

trait Colorable{
  def color: Color
}

trait ColorInvertor {
  def invert(color: Color): Color
}

trait ColorInvertible[S] { // will be inherited by shaped classes
  def invert(): S // immmutable, so whenever this is called, create a new instance of Shape with inverted color
}

abstract class FourEdgedShape extends Shape with ColorInvertible[Shape]
```
The code above is self explanatory. Now, let us define our classes that will define data.

``` scala
sealed abstract class ShapeDS
// Data classes, case classes are immutable in nature. Once set you cannot change, unless you use var variables which is not recommended.
case class RectangleDS(height: Int, width: Int) extends ShapeDS
case class SquareDS(side: Int) extends ShapeDS
case class AxisDS(foci: Int, length: Int) extends ShapeDS

//Color Data
case class Color(r: Int, b: Int, g: Int)

```
Finally we can provide concrete implementations to our abstract classes/traits.

``` scala
case class Rectangle(rect: RectangleDS, color: Color)(implicit inverter: ColorInvertor) extends FourEdgedShape {
  def area() = rect.height * rect.width
  def perimeter(): Double = 2 * (rect.width + rect.height)
  def draw() = println(s"Drawing Rectangle ${rect} with color ${color}")
  def invert(): Rectangle = copy(color = inverter.invert(color))
}

case class Square(square: SquareDS, color: Color)( implicit inverter: ColorInvertor) extends FourEdgedShape {
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
Now lets write our main class for doing some testing.

``` scala
// Main Class for testing
object LiskovTest {

  //Dont worry about the implicit keyword, it just means pass this variable wherever it is required implicitly, the compiler will do the
  //work of figuring this out
  implicit val stdColorInverter: ColorInvertor =  new ColorInvertor {
    override def invert(color: Color): Color = Color(r = 255 - color.r, g = 255 - color.g, b = 255- color.b)
  }

  def main(args: Array[String]): Unit = {
    val color = Color(210, 100, 0)
    //instantiating sub class objects
    val rect = Rectangle(RectangleDS(10, 12), color)
    val square = Square(SquareDS(10), color)
    val circle = Circle(AxisDS(10, 10), color)

    // Standard polymorphism method accepts Shape, so child classes are implicitly cast to Shape
    printShapes(rect, square, circle)

    printFourEdged(rect, square)
    //Below line will not compile as circle is not FourEdgedShape
    //    printFourEdged(rect, square, circle)
  }

  //helper methods
  def printShapes(shapeList: Shape*): Unit = shapeList.map(printArea).foreach(println)

  def printArea(shape: Shape): Shape = {
    println(shape.area())
    shape
  }

  def printFourEdged(fourEdgedList: FourEdgedShape* ): Unit = fourEdgedList.map(_.invert()).foreach(println)
}

```

The code may not light any bulbs in your mind and may seem obvious as you read, which maybe a good thing as it suggests clarity in code.

### Reflecting on previous solution and adding new requirement

Okay, lets recap some things. What advantages does the current model gives us? We have defined Shape with abstract methods like `def area(): Double` , `def perimeter(): Double` ,`def draw(): Unit`. We have separated our behaviour and data i.e, we have not embedded fields like height/width in Rectangle class itself.
Imagine if there was a requirement to add a new field now, say `center` and even though the field is there in the shape object, there is no logic to do anything with the field in shape object itself. Instead some higher level code, lets say the UI wants it for displaying it correctly. 

Also it can happen that it wont end here, there maybe other fields added to the shape object that have nothing to do with logic in shape object itself. This is a commmon occurence in software development as requirements change and we have to adapt. This may eventually lead to the shape object becoming a **GOD** object and will need to change with every requirment and may also be a source for many bugs, with every change and bug you have to write test cases, test this class and all the dependent classes too and this becomes quite a headache for software developers as the code becomes difficult to maintain and eventually when there is a new change nobody wants to touch this class as it may break some other thing :sob:. The fix to this falls under another principle called Single Responsibility Principle.

Ok so lets get back to the shape example. Uptill now our code obeys the LSP, there is no breaking change in behaviour of sub types. Lets add a requirement. Shapes should be adjustable, ie, we should be be able to manipulate their dimensions.

There are 2 ways to go about this.
- take a `factor : Float` and get new dimensions by multiplying it to _some_ or _all_ the dimensions of shape object. 
- take delta change from the user for each dimension, which may increase/decrease particular dimensions.

If we take the 1st approach, we can make a generic method on the Shape abstract class that accepts a factor and returns a new Shape Object after adjusting but if we take the 2nd approach then we need to think about how to accept different dimensions for a Concrete Shape object but still define a generic method in Shape Object.

Is the 2nd approach possible? Atleast from what I researched, there isnt a compile time friendly way to do this. We can try a modified version of Visitor pattern that accepts visitor of 2 arguments but that is not at all elegant. Lets fallback to runtime and look at other ways.

### Intro to Pattern Matching

Lets say we define a adjust method like below

``` scala
abstract class Shape extends Colorable with Drawable  {
  def area(): Double
  def perimeter(): Double
  def adjust(ds: ShapeDS) : Shape
```

We didnt talk about the ShapeDS class before. Taking a look at the signature it is, `sealed abstract class ShapeDS` and it has no content. So what use is this class? since there are no methods defined on it, its practically useless as a superclass. There is only one use for it and that is **Type Safety**, it is also called a marker interface, since it has no methods and can only be used to _mark_ a sub class. For it be truly useful we need to know the type of subclass.

To know sub type in language like scala there is a concept of **Pattern Matching**. Let's quickly understand it by a example.

``` scala{9,11,13}
object Main {
  sealed trait Animal
  trait Pet extends Animal
  trait Wild extends Animal

  case class Dog(name) extends Pet
  case class Tiger(name) extends Wild

  def handleAnimal(animal: Animal): Unit = {
    animal match {
      case Dog(name) => println(s"Take $name for a walk")
      
      case Tiger(name) => println(s"Do not approach $name, watch from afar.")
      
      case _ => 
    }
  }

}
```
We have defined a method `def handleAnimal(animal: Animal):Unit`, which takes in a instance of Animal and returns Unit. For the uninformed, Unit in scala means a function does not return anything. Inside the method we check if animal matches with instance of Dog or Animal and perform logic accordingly. It is similar to using instanceof method for checking instance type but pattern matching in scala comes with compile time safety. In Java there is nothing stopping you from checking if an Integer is instanceOf String but in scala this will throw a compile time error.

Pattern matching is very powerful and is used very heavily in Scala. In its most primitive definition it can be seen as like instanceof operator  the `match` keyword with the `case` keyword is checking for instanceof Dog/Tiger and doing some logic with Dog/Tiger instance.

### Apply Pattern Matching to Our Shapes problem

So let's change our code to use Pattern Matching. I am only showing changes for Rectangle class as others are similar.

``` scala
//Add a adjust method that accepts a ShapeDS and returns a Shape
abstract class Shape extends Colorable with Drawable  {
  def area(): Double
  def perimeter(): Double
  def adjust(delta: ShapeDS): Shape
}


case class Rectangle(rect: RectangleDS, color: Color)(implicit inverter: ColorInvertor) extends FourEdgedShape {
  def area() = rect.height * rect.width
  def perimeter(): Double = 2 * (rect.width + rect.height)
  def draw() = println(s"Drawing Rectangle ${rect} with color ${color}")
  def invert(): Rectangle = copy(color = inverter.invert(color))

//check to see if shape DS is matching with current Shape if not throw exception otherwise, adjust and return adjusted Shape
  def adjust(delta: ShapeDS): Rectangle = {
    val newDS = delta match {
      case RectangleDS(height, width) => RectangleDS(rect.height + height, rect.width + width)
      case _ => throw new IllegalArgumentException("Expected delta of type RectangleDS")
    }
    copy(rect = newDS)
  }
}
```
Usually when pattern matching is used it covers the entire range of sub types unlike what we did here by just using one sub type each time.

So you might want to spit on my face and say earlier I condemed using rect.isInstanceOf[Square]. Yes it is true because it breaks the behaviour of sub classes amd YES it breaks in our above example too. **Infact you can pass a AxisDS type in a Rectangle Shape without compile time error...which is really bad**. So what I am saying is, sometimes it is OK to break the LSP principle :P. Yes it is true, you should treat a principle as a guideline, if it doesnt suit your use case then you may need to break it.

Also another thing I cant figure out why we would want a generic method at the Shape abstract level because the client will also have to provide the appropriate DS object to the Shape object :rage:, probably it would also need to check the type of shape object using pattern matching? If this is the case then we might as well define our adjust method at the individual shape level and enjoy the benifit of type safety and pattern matching.

### Improving our solution

Lets transfer adjust method to its own trait.

``` scala
  abstract class Shape extends Colorable with Drawable  {
    def area(): Double
    def perimeter(): Double
  }

  // dont worry about the plus/minus signs they dont really affect our solution.
  trait Adjustable[-ShapeDS, +Shape]{
    def adjust(ds : ShapeDS): Shape
  }

```
Now lets define adjust method at individual Shape level

``` scala{7,16,24}
case class Rectangle(rect: RectangleDS, color: Color)(implicit inverter: ColorInvertor) extends FourEdgedShape with Adjustable[RectangleDS,Rectangle] {
  def area() = rect.height * rect.width
  def perimeter(): Double = 2 * (rect.width + rect.height)
  def draw() = println(s"Drawing Rectangle ${rect} with color ${color}")
  def invert(): Rectangle = copy(color = inverter.invert(color))

  override def adjust(ds: RectangleDS): Rectangle = copy(rect = RectangleDS(rect.height + ds.height, rect.width + ds.width))
}

case class Square(square: SquareDS, color: Color)( implicit inverter: ColorInvertor) extends FourEdgedShape with Adjustable[SquareDS,Square] {
  def area() = square.side * square.side
  def perimeter(): Double = 4 * square.side
  def draw() = println(s"Drawing Square ${square} with color ${color}")
  def invert(): Square = copy(color = inverter.invert(color))

  override def adjust(ds: SquareDS): Square = copy(square = SquareDS(square.side + ds.side))
}

case class Circle(axis: AxisDS, color: Color) extends Shape with Adjustable[AxisDS, Circle]{
  def area() = Math.PI * axis.length * axis.length
  def perimeter() = 2 * Math.PI * axis.length
  def draw() = println(s"Drawing Circle ${axis} with color ${color}")

  override def adjust(ds: AxisDS): Circle = copy(axis = AxisDS(axis.foci + ds.foci, axis.length + ds.length))
}
```

Now lets see how a client may use this code.

``` scala
object LiskovTest {

  implicit val stdColorInverter: ColorInvertor =  new ColorInvertor {
    override def invert(color: Color): Color = Color(r = 255 - color.r, g = 255 - color.g, b = 255- color.b)
  }

  def main(args: Array[String]): Unit = {
    val color = Color(210, 100, 0)
    //instantiating sub class objects
    val rect = Rectangle(RectangleDS(10, 12), color)
    val square = Square(SquareDS(10), color)
    val circle = Circle(AxisDS(10, 10), color)
    
    val shapes = List(rect, square, circle)
    println(s"\nBefore Adjusting: $shapes")
    
    val adjustedShape = adjustShapes(shapes)
    println(s"\nAfter Adjusting: $adjustedShape")
 
  }

    def adjustShapes(shapeList: List[Shape]): List[Shape] = {
    shapeList.map{
      case sh@Square(_,_) => sh.adjust(SquareDS(-2))
      case sh@Rectangle(_,_) => sh.adjust(RectangleDS(-5, 10))
      case sh@Circle(_, _) => sh.adjust(AxisDS(5, -2))
      case _ => sys.error(s"Cannot adjust unidentified shape")
    }
  }


```

If we run this, the output is

::: tip Output
Before Adjusting: List(Rectangle(RectangleDS(10,12),Color(210,100,0)), Square(SquareDS(10),Color(210,100,0)), Circle(AxisDS(10,10),Color(210,100,0)))

After Adjusting: List(Rectangle(RectangleDS(5,22),Color(210,100,0)), Square(SquareDS(8),Color(210,100,0)), Circle(AxisDS(15,8),Color(210,100,0)))
:::

Anyways that's all for now. Hope you learned something or leave a comment if you have doubts.
***
<template>
  <div>
    <div class='comments'>
      <Disqus shortname='tech-9732viigce' />
    </div>
  </div>
</template>

<script>
import { Disqus } from 'vue-disqus'

export default {
  name: 'PostPage',
  components: {
    Disqus
  }
}
</script>