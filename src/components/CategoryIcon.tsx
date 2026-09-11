import React from 'react';
import {
  Briefcase,
  Laptop,
  TrendingUp,
  PlusCircle,
  Home,
  Utensils,
  Car,
  HeartPulse,
  GraduationCap,
  Coffee,
  Tv,
  ShoppingBag,
  ShieldCheck,
  Plane,
  Tag,
  PiggyBank,
  Wallet,
  Landmark,
  DollarSign,
  CreditCard,
  Coins
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const iconProps = { className, size };

  switch (name) {
    case 'DollarSign':
      return <DollarSign {...iconProps} />;
    case 'Coins':
      return <Coins {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'Wallet':
      return <Wallet {...iconProps} />;
    case 'PiggyBank':
      return <PiggyBank {...iconProps} />;
    case 'Landmark':
      return <Landmark {...iconProps} />;
    case 'TrendingUp':
      return <TrendingUp {...iconProps} />;
    case 'CreditCard':
      return <CreditCard {...iconProps} />;
    case 'Home':
      return <Home {...iconProps} />;
    case 'Utensils':
      return <Utensils {...iconProps} />;
    case 'Car':
      return <Car {...iconProps} />;
    case 'HeartPulse':
      return <HeartPulse {...iconProps} />;
    case 'GraduationCap':
      return <GraduationCap {...iconProps} />;
    case 'Coffee':
      return <Coffee {...iconProps} />;
    case 'Tv':
      return <Tv {...iconProps} />;
    case 'ShoppingBag':
      return <ShoppingBag {...iconProps} />;
    case 'ShieldCheck':
      return <ShieldCheck {...iconProps} />;
    case 'Plane':
      return <Plane {...iconProps} />;
    case 'Laptop':
      return <Laptop {...iconProps} />;
    case 'PlusCircle':
      return <PlusCircle {...iconProps} />;
    case 'Tag':
      return <Tag {...iconProps} />;
    default:
      return <Tag {...iconProps} />;
  }
};
